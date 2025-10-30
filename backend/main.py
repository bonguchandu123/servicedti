from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import random
import string
import cloudinary
import cloudinary.uploader
import stripe
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import socketio
from geopy.distance import geodesic
import math
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

import stripe
# Import models and config
from models import *
from config import settings, Collections, CloudinaryFolders, EmailTemplates, NotificationTypes, SocketEvents, Messages

import asyncio
from concurrent.futures import ThreadPoolExecutor

# Thread pool for blocking operations
executor = ThreadPoolExecutor(max_workers=4)
# Initialize FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # <-- allows all domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        try:
            response = await asyncio.wait_for(call_next(request), timeout=30.0)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            return response
        except asyncio.TimeoutError:
            return JSONResponse(
                status_code=504,
                content={"detail": "Request timeout"}
            )

# ✅ ADD THIS LINE after CORSMiddleware
app.add_middleware(TimeoutMiddleware)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB Client
mongodb_client: Optional[AsyncIOMotorClient] = None
db = None

# Cloudinary Configuration
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

# Stripe Configuration
if stripe:
    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        # Test the API key
        stripe.Account.retrieve()
        print("✅ Stripe configured successfully")
    except stripe.error.AuthenticationError as e:
        print(f"❌ Stripe authentication failed: {e}")
        print("Check your STRIPE_SECRET_KEY in settings")
    except Exception as e:
        print(f"⚠️ Stripe configuration warning: {e}")
else:
    print("⚠️ Stripe not available - payment features disabled")


# Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.SOCKET_IO_CORS_ALLOWED_ORIGINS
)
socket_app = socketio.ASGIApp(sio, app)

# ============= DATABASE CONNECTION =============
# @app.on_event("startup")
# async def startup_db_client():
#     global mongodb_client, db
#     mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
#     db = mongodb_client[settings.DATABASE_NAME]
#     print("Connected to MongoDB!")
    
#     # Create indexes
#     await create_indexes()
@app.on_event("startup")
async def startup_db_client():
    global mongodb_client, db
    # ✅ ADD CONNECTION POOLING
    mongodb_client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=50,  # Limit concurrent connections
        minPoolSize=10,
        maxIdleTimeMS=30000,
        serverSelectionTimeoutMS=5000
    )
    db = mongodb_client[settings.DATABASE_NAME]
    print("Connected to MongoDB!")
    
    # ✅ CREATE INDEXES ONLY IF NEEDED
    await create_indexes_if_needed()

async def create_indexes_if_needed():
    """Create indexes only if they don't exist"""
    try:
        indexes = await db[Collections.USERS].index_information()
        if 'email_1' not in indexes:
            print("Creating indexes...")
            await create_indexes()
        else:
            print("Indexes already exist, skipping")
    except Exception as e:
        print(f"Error checking indexes: {e}")
@app.on_event("shutdown")
async def shutdown_db_client():
    if mongodb_client:
        mongodb_client.close()
        print("Disconnected from MongoDB!")

async def create_indexes():
    """Create database indexes for better performance"""
    # Users
    await db[Collections.USERS].create_index("email", unique=True)
    await db[Collections.USERS].create_index("role")
    
    # Servicers
    await db[Collections.SERVICERS].create_index("user_id")
    await db[Collections.SERVICERS].create_index("verification_status")
    await db[Collections.SERVICERS].create_index([("service_categories", 1)])
    
    # Bookings
    await db[Collections.BOOKINGS].create_index("booking_number", unique=True)
    await db[Collections.BOOKINGS].create_index("user_id")
    await db[Collections.BOOKINGS].create_index("servicer_id")
    await db[Collections.BOOKINGS].create_index("booking_status")
    
    # Transactions
    await db[Collections.TRANSACTIONS].create_index("user_id")
    await db[Collections.TRANSACTIONS].create_index("booking_id")
    
    # OTPs
    await db[Collections.OTPS].create_index("email")
    await db[Collections.OTPS].create_index("expires_at", expireAfterSeconds=0)

# ============= HELPER FUNCTIONS =============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

def generate_booking_number() -> str:
    return f"BK{datetime.utcnow().strftime('%Y%m%d')}{random.randint(1000, 9999)}"

def generate_ticket_number() -> str:
    return f"TK{datetime.utcnow().strftime('%Y%m%d')}{random.randint(1000, 9999)}"

def calculate_platform_fee(amount: float) -> float:
    return round(amount * (settings.PLATFORM_FEE_PERCENTAGE / 100), 2)

async def create_servicer_profile_background(user_id: str, category_ids: List[str]):
    """Create servicer profile in background"""
    try:
        service_category_ids = [ObjectId(cat_id) for cat_id in category_ids if ObjectId.is_valid(cat_id)]
        
        if not service_category_ids:
            print(f"⚠️ No valid categories for servicer {user_id}")
            return
        
        servicer = {
            "user_id": ObjectId(user_id),
            "service_categories": service_category_ids,
            "experience_years": 0,
            "verification_status": VerificationStatus.PENDING,
            "average_rating": 0.0,
            "total_ratings": 0,
            "total_jobs_completed": 0,
            "service_radius_km": 10.0,
            "availability_status": AvailabilityStatus.OFFLINE,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db[Collections.SERVICERS].insert_one(servicer)
        print(f"✅ Servicer profile created for {user_id}")
        
    except Exception as e:
        print(f"❌ Background servicer creation failed: {e}")

async def create_servicer_profile_with_validated_categories(user_id: str, category_ids: List[ObjectId]):
    """Create servicer profile with already validated ObjectId categories"""
    try:
        print(f"📝 Creating servicer profile for {user_id} with {len(category_ids)} categories")
        
        servicer = {
            "user_id": ObjectId(user_id),
            "service_categories": category_ids,  # Already ObjectIds
            "experience_years": 0,
            "verification_status": VerificationStatus.PENDING,
            "average_rating": 0.0,
            "total_ratings": 0,
            "total_jobs_completed": 0,
            "service_radius_km": 10.0,
            "availability_status": AvailabilityStatus.OFFLINE,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db[Collections.SERVICERS].insert_one(servicer)
        print(f"✅ Servicer profile created: {result.inserted_id}")
        
        # Log categories for debugging
        for cat_id in category_ids:
            category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": cat_id})
            print(f"  - Category: {category['name'] if category else 'Unknown'}")
        
    except Exception as e:
        print(f"❌ Background servicer creation failed: {e}")

async def send_welcome_email_background(email: str, name: str, role: str):
    """Send welcome email in background"""
    try:
        await send_email(
            email,
            "Welcome to Service Provider Platform",
            f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4F46E5;">Welcome {name}!</h2>
                    <p>Your account has been created successfully.</p>
                    <p><strong>Account Type:</strong> {role.capitalize()}</p>
                    <hr style="margin: 20px 0;">
                </body>
            </html>
            """
        )
        print(f"✅ Welcome email sent to {email}")
    except Exception as e:
        print(f"⚠️ Welcome email failed: {e}")

async def update_last_login_background(user_id: ObjectId):
    """Update last login in background"""
    try:
        await db[Collections.USERS].update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.utcnow()}}
        )
    except Exception as e:
        print(f"Last login update failed: {e}")
def calculate_servicer_amount(total_amount: float, platform_fee: float) -> float:
    return round(total_amount - platform_fee, 2)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two coordinates"""
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers

def calculate_eta(distance_km: float, avg_speed_kmh: float = 30) -> int:
    """Calculate ETA in minutes"""
    return int((distance_km / avg_speed_kmh) * 60)

# async def send_email(to_email: str, subject: str, body: str):
#     """Send email using SMTP"""
#     try:
#         msg = MIMEMultipart('alternative')
#         msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
#         msg['To'] = to_email
#         msg['Subject'] = subject
        
#         html_part = MIMEText(body, 'html')
#         msg.attach(html_part)
        
#         with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
#             server.starttls()
#             server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
#             server.send_message(msg)
        
#         return True
#     except Exception as e:
#         print(f"Email sending failed: {e}")
#         return False

async def send_email(to_email: str, subject: str, body: str):
    """Send email in background - non-blocking"""
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, _send_email_sync, to_email, subject, body)
        return True
    except Exception as e:
        print(f"⚠️ Email failed (non-blocking): {e}")
        return False
# In main.py, update _send_email_sync function:

def _send_email_sync(to_email: str, subject: str, body: str):
    """Synchronous email sending with detailed logging"""
    try:
        print(f"📧 Attempting to send email to: {to_email}")
        print(f"📧 Subject: {subject}")
        print(f"📧 SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.set_debuglevel(1)  # ✅ Enable SMTP debug output
            server.starttls()
            print(f"✅ TLS started")
            
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            print(f"✅ SMTP login successful")
            
            result = server.send_message(msg)
            print(f"✅ Email sent successfully to {to_email}")
            print(f"📊 Server response: {result}")
            
        return True
    except smtplib.SMTPException as e:
        print(f"❌ SMTP Error sending to {to_email}: {e}")
        return False
    except Exception as e:
        print(f"❌ General Error sending to {to_email}: {e}")
        return False

async def send_otp_email(email: str, otp: str, purpose: str):
    """Send OTP email"""
    subject = "Your OTP for Service Provider Platform"
    body = f"""
    <html>
        <body>
            <h2>Email Verification</h2>
            <p>Your OTP for {purpose} is: <strong>{otp}</strong></p>
            <p>This OTP will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </body>
    </html>
    """
    await send_email(email, subject, body)
async def upload_to_cloudinary(file: UploadFile, folder: str, allowed_types: list = None) -> dict:
    """
    Upload file to Cloudinary with validation
    
    Args:
        file: UploadFile to upload
        folder: Cloudinary folder path
        allowed_types: List of allowed MIME types (e.g., ['image/*', 'application/pdf'])
                      If None, allows all types
    """
    try:
        # Read file content
        contents = await file.read()
        file_size_mb = len(contents) / (1024 * 1024)
        
        print(f"📤 Uploading: {file.filename} ({file.content_type}, {file_size_mb:.2f}MB)")
        
        # Validate file size (max 10MB)
        if file_size_mb > 10:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large: {file_size_mb:.2f}MB. Maximum 10MB allowed."
            )
        
        # Validate file type if allowed_types is specified
        if allowed_types:
            is_allowed = False
            for allowed_type in allowed_types:
                if allowed_type.endswith('/*'):
                    # Wildcard matching (e.g., 'image/*')
                    type_prefix = allowed_type.split('/')[0]
                    if file.content_type.startswith(type_prefix + '/'):
                        is_allowed = True
                        break
                elif file.content_type == allowed_type:
                    # Exact match (e.g., 'application/pdf')
                    is_allowed = True
                    break
            
            if not is_allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}"
                )
        
        # Determine resource type based on content type
        if file.content_type.startswith('image/'):
            resource_type = "image"
        elif file.content_type == 'application/pdf':
            resource_type = "raw"  # PDFs should be uploaded as 'raw'
        else:
            resource_type = "auto"
        
        print(f"📦 Resource type: {resource_type}")
        
        # Upload to Cloudinary
        upload_params = {
            "folder": folder,
            "resource_type": resource_type,
            "unique_filename": True,
            "overwrite": True
        }
        
        # For images, optionally convert to JPG for consistency
        if resource_type == "image":
            upload_params["format"] = "jpg"
        
        result = cloudinary.uploader.upload(contents, **upload_params)
        
        print(f"✅ Upload successful: {result['secure_url']}")
        
        return {
            "url": result['secure_url'],
            "public_id": result['public_id'],
            "resource_type": result['resource_type']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

async def create_notification(user_id: str, notification_type: str, title: str, message: str, metadata: dict = None):
    """Create notification - non-blocking"""
    try:
        notification = {
            "user_id": ObjectId(user_id),
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "is_read": False,
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }
        result = await db[Collections.NOTIFICATIONS].insert_one(notification)
        notification['_id'] = str(result.inserted_id)
        notification['user_id'] = str(notification['user_id'])
        
        # ✅ Emit socket in background
        asyncio.create_task(
            emit_notification_socket(user_id, notification)
        )
        
        return notification
    except Exception as e:
        print(f"⚠️ Notification failed: {e}")
        return None

# ✅ ADD THIS NEW FUNCTION
async def emit_notification_socket(user_id: str, notification: dict):
    """Emit socket notification in background"""
    try:
        await sio.emit(SocketEvents.NEW_NOTIFICATION, notification, room=f"user-{user_id}")
    except Exception as e:
        print(f"Socket emit failed: {e}")
# ============= AUTHENTICATION =============
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail=Messages.UNAUTHORIZED)
        
        user = await db[Collections.USERS].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail=Messages.UNAUTHORIZED)
        
        if user.get("is_blocked"):
            raise HTTPException(status_code=403, detail=Messages.ACCOUNT_BLOCKED)
        
        user['_id'] = str(user['_id'])
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail=Messages.UNAUTHORIZED)

async def get_current_servicer(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current servicer (must be servicer role)"""
    if current_user['role'] != UserRole.SERVICER:
        raise HTTPException(status_code=403, detail=Messages.FORBIDDEN)
    
    servicer = await db[Collections.SERVICERS].find_one({"user_id": ObjectId(current_user['_id'])})
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer profile not found")
    
    servicer['_id'] = str(servicer['_id'])
    servicer['user_id'] = str(servicer['user_id'])
    return servicer

async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current admin (must be admin role)"""
    if current_user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail=Messages.FORBIDDEN)
    return current_user


def convert_objectid_to_str(document):
    """
    Recursively convert all ObjectId instances in a document to strings.
    Useful for preparing MongoDB documents for JSON serialization.
    """
    if document is None:
        return None
    
    if isinstance(document, ObjectId):
        return str(document)
    
    if isinstance(document, dict):
        return {key: convert_objectid_to_str(value) for key, value in document.items()}
    
    if isinstance(document, list):
        return [convert_objectid_to_str(item) for item in document]
    
    if isinstance(document, datetime):
        return document.isoformat()
    
    return document


# ============= SOCKET.IO CHAT EVENTS (Add after existing socket events) =============

# Store connected users
connected_users = {}  # {user_id: sid}

@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit('connection_established', {'sid': sid}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    # Remove from connected users
    for user_id, socket_id in list(connected_users.items()):
        if socket_id == sid:
            del connected_users[user_id]
            break

@sio.event
async def authenticate_socket(sid, data):
    """Authenticate socket connection with user token"""
    try:
        token = data.get('token')
        if not token:
            await sio.emit('auth_error', {'message': 'Token required'}, room=sid)
            return
        
        # Verify token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            await sio.emit('auth_error', {'message': 'Invalid token'}, room=sid)
            return
        
        # Store user connection
        connected_users[user_id] = sid
        
        # Join user-specific room
        await sio.enter_room(sid, f"user-{user_id}")
        
        # Get user info
        user = await db[Collections.USERS].find_one({"_id": ObjectId(user_id)})
        
        # If admin, join admin room
        if user and user['role'] == UserRole.ADMIN:
            await sio.enter_room(sid, "admins")
        
        print(f"User {user_id} authenticated with socket {sid}")
        await sio.emit('authenticated', {
            'user_id': user_id,
            'status': 'connected'
        }, room=sid)
        
    except JWTError as e:
        print(f"JWT Error: {e}")
        await sio.emit('auth_error', {'message': 'Invalid token'}, room=sid)
    except Exception as e:
        print(f"Auth error: {e}")
        await sio.emit('auth_error', {'message': str(e)}, room=sid)

@sio.event
async def join_chat(sid, data):
    """Join a specific chat room"""
    try:
        chat_id = data.get('chat_id')
        booking_id = data.get('booking_id')
        
        if chat_id:
            # Join pre-booking chat room
            await sio.enter_room(sid, f"chat-{chat_id}")
            await sio.emit('joined_chat', {'chat_id': chat_id}, room=sid)
            print(f"Socket {sid} joined chat room: chat-{chat_id}")
        elif booking_id:
            # Join booking chat room
            await sio.enter_room(sid, f"booking-chat-{booking_id}")
            await sio.emit('joined_chat', {'booking_id': booking_id}, room=sid)
            print(f"Socket {sid} joined booking chat room: booking-chat-{booking_id}")
            
    except Exception as e:
        print(f"Error joining chat: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def leave_chat(sid, data):
    """Leave a chat room"""
    try:
        chat_id = data.get('chat_id')
        booking_id = data.get('booking_id')
        
        if chat_id:
            await sio.leave_room(sid, f"chat-{chat_id}")
        elif booking_id:
            await sio.leave_room(sid, f"booking-chat-{booking_id}")
            
    except Exception as e:
        print(f"Error leaving chat: {e}")

@sio.event
async def send_chat_message(sid, data):
    """Handle real-time chat message sending - WITH NOTIFICATION"""
    try:
        chat_type = data.get('chat_type', 'pre_booking')
        chat_id = data.get('chat_id')
        booking_id = data.get('booking_id')
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        message_text = data.get('message_text')
        message_type = data.get('message_type', 'text')
        
        if not message_text or not sender_id or not receiver_id:
            await sio.emit('message_error', {'message': 'Missing required fields'}, room=sid)
            return
        
        # Get sender info for notification
        sender = await db[Collections.USERS].find_one({"_id": ObjectId(sender_id)})
        sender_name = sender.get('name', 'Someone') if sender else 'Someone'
        
        # Create message based on chat type
        if chat_type == 'pre_booking' and chat_id:
            # Pre-booking chat
            message = {
                "chat_id": ObjectId(chat_id),
                "sender_id": ObjectId(sender_id),
                "receiver_id": ObjectId(receiver_id),
                "message_type": message_type,
                "message_text": message_text,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "is_read": False
            }
            
            result = await db[Collections.PRE_BOOKING_MESSAGES].insert_one(message)
            message['_id'] = str(result.inserted_id)
            message['chat_id'] = str(message['chat_id'])
            message['sender_id'] = str(message['sender_id'])
            message['receiver_id'] = str(message['receiver_id'])
            
            # Update chat last message time
            await db[Collections.PRE_BOOKING_CHATS].update_one(
                {"_id": ObjectId(chat_id)},
                {"$set": {"last_message_at": datetime.utcnow()}}
            )
            
            # Emit to chat room
            await sio.emit('new_message', message, room=f"chat-{chat_id}")
            
            # Emit to receiver's personal room
            await sio.emit('receive_message', message, room=f"user-{receiver_id}")
            
            # ✅ SEND NOTIFICATION
            await create_notification(
                receiver_id,
                NotificationTypes.SYSTEM,
                "New Message",
                f"{sender_name}: {message_text[:100]}{'...' if len(message_text) > 100 else ''}",
                metadata={
                    "chat_id": chat_id,
                    "sender_name": sender_name,
                    "message_preview": message_text[:100]
                }
            )
            
        elif chat_type == 'booking' and booking_id:
            # Booking chat
            message = {
                "booking_id": ObjectId(booking_id),
                "sender_id": ObjectId(sender_id),
                "receiver_id": ObjectId(receiver_id),
                "message_type": message_type,
                "message_text": message_text,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "is_read": False
            }
            
            result = await db[Collections.CHAT_MESSAGES].insert_one(message)
            message['_id'] = str(result.inserted_id)
            message['booking_id'] = str(message['booking_id'])
            message['sender_id'] = str(message['sender_id'])
            message['receiver_id'] = str(message['receiver_id'])
            
            # Get booking details for notification
            booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
            booking_number = booking.get('booking_number', 'N/A') if booking else 'N/A'
            
            # Emit to booking chat room
            await sio.emit('new_message', message, room=f"booking-chat-{booking_id}")
            
            # Emit to receiver's personal room
            await sio.emit('receive_message', message, room=f"user-{receiver_id}")
            
            # ✅ SEND NOTIFICATION
            await create_notification(
                receiver_id,
                NotificationTypes.SYSTEM,
                f"New Message - Booking #{booking_number}",
                f"{sender_name}: {message_text[:100]}{'...' if len(message_text) > 100 else ''}",
                metadata={
                    "booking_id": booking_id,
                    "booking_number": booking_number,
                    "sender_name": sender_name,
                    "message_preview": message_text[:100]
                }
            )
        
        print(f"✅ Message and notification sent from {sender_id} to {receiver_id}")
        
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        await sio.emit('message_error', {'message': str(e)}, room=sid)

@sio.event
async def typing_indicator(sid, data):
    """Handle typing indicator"""
    try:
        chat_id = data.get('chat_id')
        booking_id = data.get('booking_id')
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        is_typing = data.get('is_typing', True)
        
        typing_data = {
            'sender_id': sender_id,
            'is_typing': is_typing
        }
        
        if chat_id:
            # Emit to chat room
            await sio.emit('user_typing', typing_data, room=f"chat-{chat_id}")
        elif booking_id:
            # Emit to booking chat room
            await sio.emit('user_typing', typing_data, room=f"booking-chat-{booking_id}")
        
        # Also emit to receiver's personal room
        if receiver_id:
            await sio.emit('user_typing', typing_data, room=f"user-{receiver_id}")
            
    except Exception as e:
        print(f"Error sending typing indicator: {e}")

@sio.event
async def message_read(sid, data):
    """Mark message as read"""
    try:
        message_id = data.get('message_id')
        chat_type = data.get('chat_type', 'pre_booking')
        user_id = data.get('user_id')
        
        if chat_type == 'pre_booking':
            result = await db[Collections.PRE_BOOKING_MESSAGES].update_one(
                {"_id": ObjectId(message_id), "receiver_id": ObjectId(user_id)},
                {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
            )
        else:
            result = await db[Collections.CHAT_MESSAGES].update_one(
                {"_id": ObjectId(message_id), "receiver_id": ObjectId(user_id)},
                {"$set": {"is_read": True, "read_at": datetime.utcnow()}}
            )
        
        if result.modified_count > 0:
            # Notify sender that message was read
            message = await db[Collections.PRE_BOOKING_MESSAGES if chat_type == 'pre_booking' else Collections.CHAT_MESSAGES].find_one(
                {"_id": ObjectId(message_id)}
            )
            if message:
                await sio.emit('message_read_receipt', {
                    'message_id': message_id,
                    'reader_id': user_id
                }, room=f"user-{str(message['sender_id'])}")
                
    except Exception as e:
        print(f"Error marking message as read: {e}")

@sio.event
async def get_online_status(sid, data):
    """Check if user is online"""
    try:
        user_id = data.get('user_id')
        is_online = user_id in connected_users
        
        await sio.emit('online_status', {
            'user_id': user_id,
            'is_online': is_online
        }, room=sid)
        
    except Exception as e:
        print(f"Error getting online status: {e}")
# ============= AUTHENTICATION ENDPOINTS =============
@app.post("/api/auth/signup", response_model=SuccessResponse)
async def signup(user_data: UserCreate):
    """FIXED signup - validates category IDs"""
    
    # 1. Quick validation
    if user_data.role == UserRole.SERVICER:
        if not user_data.service_categories or len(user_data.service_categories) == 0:
            raise HTTPException(status_code=400, detail="Servicers must select at least one service category")
        
        # ✅ FIX: Validate that category IDs exist in database
        print(f"🔍 Validating {len(user_data.service_categories)} categories...")
        
        valid_category_ids = []
        for cat_id in user_data.service_categories:
            try:
                # Convert to ObjectId and check if exists
                obj_id = ObjectId(cat_id)
                category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": obj_id})
                
                if category:
                    valid_category_ids.append(obj_id)
                    print(f"  ✅ Valid: {cat_id} - {category['name']}")
                else:
                    print(f"  ⚠️ Invalid: {cat_id} - not found in database")
                    
            except Exception as e:
                print(f"  ❌ Invalid ObjectId: {cat_id} - {e}")
                raise HTTPException(status_code=400, detail=f"Invalid category ID: {cat_id}")
        
        if len(valid_category_ids) == 0:
            raise HTTPException(status_code=400, detail="No valid service categories provided")
        
        print(f"✅ {len(valid_category_ids)} valid categories confirmed")
    
    # 2. Check duplicates (single query)
    existing = await db[Collections.USERS].find_one({
        "$or": [
            {"email": user_data.email},
            {"phone": user_data.phone}
        ]
    })
    
    if existing:
        if existing['email'] == user_data.email:
            raise HTTPException(status_code=400, detail=Messages.EMAIL_EXISTS)
        else:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # 3. Create user
    user_dict = user_data.dict(exclude={'service_categories'})
    user_dict['password_hash'] = hash_password(user_dict.pop('password'))
    user_dict['created_at'] = datetime.utcnow()
    user_dict['updated_at'] = datetime.utcnow()
    user_dict['email_verified'] = False
    user_dict['is_active'] = True
    user_dict['is_blocked'] = False
    
    try:
        # Insert user
        user_result = await db[Collections.USERS].insert_one(user_dict)
        user_id = str(user_result.inserted_id)
        print(f"✅ User created: {user_id}")
        
        # Create wallet immediately
        wallet = {
            "user_id": ObjectId(user_id),
            "balance": 0.0,
            "total_earned": 0.0,
            "total_spent": 0.0,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db[Collections.WALLETS].insert_one(wallet)
        print(f"✅ Wallet created for user {user_id}")
        
    except Exception as e:
        print(f"❌ Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account")
    
    # 4. ✅ Handle servicer profile in BACKGROUND with validated IDs
    if user_data.role == UserRole.SERVICER:
        asyncio.create_task(
            create_servicer_profile_with_validated_categories(user_id, valid_category_ids)
        )
    
    # 5. ✅ Send email in BACKGROUND
    asyncio.create_task(
        send_welcome_email_background(user_data.email, user_data.name, user_data.role)
    )
    
    # 6. ✅ Return immediately
    return SuccessResponse(
        message="Account created successfully! Welcome email sent.",
        data={
            "user_id": user_id,
            "email": user_data.email,
            "role": user_data.role,
            "name": user_data.name,
            "categories_added": len(valid_category_ids) if user_data.role == UserRole.SERVICER else 0
        }
    )



@app.post("/api/auth/send-otp", response_model=SuccessResponse)
async def send_otp(otp_request: OTPCreate):
    """Send OTP for email verification or password reset"""
    # Check if user exists
    user = await db[Collections.USERS].find_one({"email": otp_request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate OTP
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    # Store OTP
    otp_doc = {
        "email": otp_request.email,
        "otp_code": otp_code,
        "purpose": otp_request.purpose,
        "expires_at": expires_at,
        "verified": False,
        "attempts": 0,
        "created_at": datetime.utcnow()
    }
    await db[Collections.OTPS].insert_one(otp_doc)
    
    # Send OTP email
    await send_otp_email(otp_request.email, otp_code, otp_request.purpose)
    
    return SuccessResponse(message=Messages.OTP_SENT)

@app.post("/api/auth/verify-otp", response_model=SuccessResponse)
async def verify_otp(email: EmailStr = Form(...), otp_code: str = Form(...)):
    """Verify OTP"""
    # Find OTP
    otp_doc = await db[Collections.OTPS].find_one({
        "email": email,
        "otp_code": otp_code,
        "verified": False
    })
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail=Messages.INVALID_OTP)
    
    # Check expiry
    if datetime.utcnow() > otp_doc['expires_at']:
        raise HTTPException(status_code=400, detail=Messages.OTP_EXPIRED)
    
    # Check attempts
    if otp_doc['attempts'] >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail=Messages.MAX_OTP_ATTEMPTS)
    
    # Increment attempts
    await db[Collections.OTPS].update_one(
        {"_id": otp_doc['_id']},
        {"$inc": {"attempts": 1}}
    )
    
    # Mark OTP as verified
    await db[Collections.OTPS].update_one(
        {"_id": otp_doc['_id']},
        {"$set": {"verified": True}}
    )
    
    # Update user email verification
    await db[Collections.USERS].update_one(
        {"email": email},
        {"$set": {"email_verified": True, "otp_verified": True}}
    )
    
    return SuccessResponse(message=Messages.OTP_VERIFIED)
@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """OPTIMIZED login"""
    user = await db[Collections.USERS].find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail=Messages.INVALID_CREDENTIALS)
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail=Messages.INVALID_CREDENTIALS)
    
    if user.get('is_blocked'):
        raise HTTPException(status_code=403, detail=Messages.ACCOUNT_BLOCKED)
    
    if user['role'] == UserRole.SERVICER:
        servicer = await db[Collections.SERVICERS].find_one({"user_id": user['_id']})
        if not servicer:
            print(f"⚠️ Servicer profile missing for {user['_id']}, creating now...")
            servicer = {
                "user_id": user['_id'],
                "service_categories": [],
                "experience_years": 0,
                "verification_status": VerificationStatus.PENDING,
                "average_rating": 0.0,
                "total_ratings": 0,
                "total_jobs_completed": 0,
                "service_radius_km": 10.0,
                "availability_status": AvailabilityStatus.OFFLINE,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db[Collections.SERVICERS].insert_one(servicer)
            print(f"✅ Servicer profile created for {user['_id']}")
    
    asyncio.create_task(update_last_login_background(user['_id']))
    
    access_token = create_access_token(
        data={"sub": str(user['_id']), "role": user['role']}
    )
    
    user['_id'] = str(user['_id'])
    user.pop('password_hash', None)
    
    return Token(access_token=access_token, user=user)

@app.post("/api/auth/forgot-password", response_model=SuccessResponse)
async def forgot_password(email: EmailStr = Form(...)):
    """Send password reset OTP"""
    otp_request = OTPCreate(email=email, purpose="password_reset")
    return await send_otp(otp_request)

@app.post("/api/auth/reset-password", response_model=SuccessResponse)
async def reset_password(
    email: EmailStr = Form(...),
    otp_code: str = Form(...),
    new_password: str = Form(...)
):
    """Reset password with OTP"""
    # Verify OTP first
    await verify_otp(email, otp_code)
    
    # Update password
    hashed_password = hash_password(new_password)
    await db[Collections.USERS].update_one(
        {"email": email},
        {"$set": {"password_hash": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return SuccessResponse(message=Messages.PASSWORD_RESET)

@app.put("/api/auth/change-password", response_model=SuccessResponse)
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Change password for authenticated user"""
    user = await db[Collections.USERS].find_one({"_id": ObjectId(current_user['_id'])})
    
    if not verify_password(old_password, user['password_hash']):
        raise HTTPException(status_code=400, detail="Invalid old password")
    
    hashed_password = hash_password(new_password)
    await db[Collections.USERS].update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": {"password_hash": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return SuccessResponse(message=Messages.PASSWORD_CHANGED)



# ============= PAYMENT ENDPOINTS (WITHOUT WEBHOOK) =============

# Replace the webhook handler with these endpoints

@app.post("/api/payments/confirm-payment")
async def confirm_payment(
    payment_intent_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm payment status after Stripe payment completion
    Call this from frontend after payment succeeds
    """
    try:
        # Retrieve payment intent from Stripe to verify status
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Find transaction in database
        transaction = await db[Collections.TRANSACTIONS].find_one({
            "stripe_payment_intent_id": payment_intent_id
        })
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Check if already processed
        if transaction['transaction_status'] == PaymentStatus.COMPLETED:
            return SuccessResponse(message="Payment already processed")
        
        # Verify payment succeeded
        if payment_intent.status == 'succeeded':
            # Update transaction status
            await db[Collections.TRANSACTIONS].update_one(
                {"_id": transaction['_id']},
                {
                    "$set": {
                        "transaction_status": PaymentStatus.COMPLETED,
                        "payment_completed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Handle wallet topup
            if payment_intent.metadata.get('purpose') == 'wallet_topup':
                user_id = payment_intent.metadata.get('user_id')
                amount = payment_intent.amount / 100  # Convert from paise to rupees
                
                await db[Collections.WALLETS].update_one(
                    {"user_id": ObjectId(user_id)},
                    {
                        "$inc": {"balance": amount},
                        "$set": {"last_transaction_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
                    }
                )
                
                # Send notification
                await create_notification(
                    user_id,
                    NotificationTypes.PAYMENT,
                    "Wallet Topped Up",
                    f"₹{amount} added to your wallet successfully"
                )
                
                return SuccessResponse(
                    message="Payment successful! Wallet topped up",
                    data={"amount": amount, "type": "wallet_topup"}
                )
            
            # Handle booking payment
            elif transaction.get('booking_id'):
                booking_id = transaction['booking_id']
                
                # Update booking payment status
                await db[Collections.BOOKINGS].update_one(
                    {"_id": ObjectId(booking_id)},
                    {
                        "$set": {
                            "payment_status": PaymentStatus.COMPLETED,
                            "payment_completed_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
                
                # Send notification to user
                await create_notification(
                    str(booking['user_id']),
                    NotificationTypes.PAYMENT,
                    "Payment Successful",
                    f"Payment completed for booking #{booking['booking_number']}"
                )
                
                # Send notification to servicer
                servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
                if servicer:
                    await create_notification(
                        str(servicer['user_id']),
                        NotificationTypes.PAYMENT,
                        "Payment Received",
                        f"Payment received for booking #{booking['booking_number']}"
                    )
                
                # Emit socket event to user
                await sio.emit(
                    SocketEvents.PAYMENT_COMPLETED,
                    {"booking_id": str(booking_id), "booking_number": booking['booking_number']},
                    room=f"user-{str(booking['user_id'])}"
                )
                
                # Emit socket event to servicer
                if servicer:
                    await sio.emit(
                        SocketEvents.PAYMENT_COMPLETED,
                        {"booking_id": str(booking_id), "booking_number": booking['booking_number']},
                        room=f"user-{str(servicer['user_id'])}"
                    )
                
                return SuccessResponse(
                    message="Payment successful! Booking confirmed",
                    data={
                        "booking_id": str(booking_id),
                        "booking_number": booking['booking_number'],
                        "amount": booking['total_amount'],
                        "type": "booking_payment"
                    }
                )
            
            return SuccessResponse(message="Payment successful")
        
        elif payment_intent.status == 'processing':
            return JSONResponse(
                status_code=202,
                content={
                    "status": "processing",
                    "message": "Payment is being processed. Please wait..."
                }
            )
        
        elif payment_intent.status in ['requires_payment_method', 'requires_confirmation']:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "incomplete",
                    "message": "Payment requires additional action"
                }
            )
        
        elif payment_intent.status == 'canceled':
            # Update transaction to failed
            await db[Collections.TRANSACTIONS].update_one(
                {"_id": transaction['_id']},
                {"$set": {"transaction_status": PaymentStatus.FAILED, "updated_at": datetime.utcnow()}}
            )
            
            raise HTTPException(status_code=400, detail="Payment was canceled")
        
        else:
            raise HTTPException(status_code=400, detail=f"Payment status: {payment_intent.status}")
            
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")




@app.post("/api/payments/handle-failed-payment")
async def handle_failed_payment(
    payment_intent_id: str = Form(...),
    error_message: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Handle failed payment - update database
    """
    try:
        # Find transaction
        transaction = await db[Collections.TRANSACTIONS].find_one({
            "stripe_payment_intent_id": payment_intent_id
        })
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update transaction to failed
        await db[Collections.TRANSACTIONS].update_one(
            {"_id": transaction['_id']},
            {
                "$set": {
                    "transaction_status": PaymentStatus.FAILED,
                    "failure_reason": error_message,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # If it was a booking payment, update booking
        if transaction.get('booking_id'):
            await db[Collections.BOOKINGS].update_one(
                {"_id": ObjectId(transaction['booking_id'])},
                {
                    "$set": {
                        "payment_status": PaymentStatus.FAILED,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Send notification
        await create_notification(
            str(transaction['user_id']),
            NotificationTypes.PAYMENT,
            "Payment Failed",
            f"Payment of ₹{transaction['amount']} failed. {error_message or 'Please try again.'}"
        )
        
        return SuccessResponse(message="Payment failure recorded")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/bookings/stats")
async def get_booking_statistics(current_user: dict = Depends(get_current_user)):
    """Get user's booking statistics"""
    user_id = ObjectId(current_user['_id'])
    
    total_bookings = await db[Collections.BOOKINGS].count_documents({"user_id": user_id})
    completed = await db[Collections.BOOKINGS].count_documents({
        "user_id": user_id,
        "booking_status": BookingStatus.COMPLETED
    })
    cancelled = await db[Collections.BOOKINGS].count_documents({
        "user_id": user_id,
        "booking_status": BookingStatus.CANCELLED
    })
    
    # Total spent
    transactions = await db[Collections.TRANSACTIONS].find({
        "user_id": user_id,
        "transaction_status": PaymentStatus.COMPLETED,
        "transaction_type": TransactionType.BOOKING_PAYMENT
    }).to_list(1000)
    
    total_spent = sum(t['amount'] for t in transactions)
    
    # Most used service
    pipeline = [
        {"$match": {"user_id": user_id, "booking_status": BookingStatus.COMPLETED}},
        {"$group": {"_id": "$service_category_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    most_used = await db[Collections.BOOKINGS].aggregate(pipeline).to_list(1)
    favorite_service = None
    
    if most_used:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": most_used[0]['_id']})
        favorite_service = category.get('name') if category else None
    
    return {
        "total_bookings": total_bookings,
        "completed_bookings": completed,
        "cancelled_bookings": cancelled,
        "total_spent": round(total_spent, 2),
        "favorite_service": favorite_service
    }



@app.get("/api/user/bookings/history")
async def get_booking_history(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get completed/cancelled booking history"""
    query = {
        "user_id": ObjectId(current_user['_id']),
        "booking_status": {"$in": [BookingStatus.COMPLETED, BookingStatus.CANCELLED]}
    }
    
    skip = (page - 1) * limit
    bookings = await db[Collections.BOOKINGS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert all ObjectIds and datetimes first
    bookings = [convert_objectids(booking) for booking in bookings]
    
    # Then add servicer details
    for booking in bookings:
        # Get servicer details - use string ID after conversion
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
        if servicer:
            user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
            if user:
                booking['servicer_name'] = user.get('name', '')
                booking['servicer_image'] = user.get('profile_image_url', '')
    
    total = await db[Collections.BOOKINGS].count_documents(query)
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


def convert_objectids(doc):
    """Recursively convert ObjectIds to strings in a document"""
    if isinstance(doc, dict):
        return {k: convert_objectids(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [convert_objectids(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif hasattr(doc, 'isoformat'):  # datetime objects
        return doc.isoformat()
    return doc

@app.get("/api/user/dashboard")
async def get_user_dashboard(current_user: dict = Depends(get_current_user)):
    """Get user dashboard overview"""
    user_id = ObjectId(current_user['_id'])
    
    # Get active bookings
    active_bookings = await db[Collections.BOOKINGS].count_documents({
        "user_id": user_id,
        "booking_status": {"$in": [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]}
    })
    
    # Get favorites count
    favorites_count = await db[Collections.FAVORITE_SERVICERS].count_documents({"user_id": user_id})
    
    # Get wallet balance
    wallet = await db[Collections.WALLETS].find_one({"user_id": user_id})
    wallet_balance = float(wallet['balance']) if wallet else 0.0
    
    # Get unread notifications
    unread_notifications = await db[Collections.NOTIFICATIONS].count_documents({
        "user_id": user_id,
        "is_read": False
    })
    
    # Get recent bookings
    recent_bookings = await db[Collections.BOOKINGS].find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Convert all ObjectIds and datetimes
    recent_bookings = [convert_objectids(booking) for booking in recent_bookings]
    
    return {
        "active_bookings": active_bookings,
        "favorites_count": favorites_count,
        "wallet_balance": wallet_balance,
        "unread_notifications": unread_notifications,
        "recent_bookings": recent_bookings
    }
@app.get("/api/user/servicers/search")
async def search_servicers(
    category: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: float = 10.0,
    min_rating: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Search servicers with filters"""
    query = {"verification_status": VerificationStatus.APPROVED}
    
    # ✅ IMPROVED: Handle both ObjectId and string category IDs
    if category:
        # Try to convert to ObjectId, fall back to string comparison
        try:
            category_obj = ObjectId(category)
            # Search for either ObjectId or string version
            query["service_categories"] = {
                "$in": [category_obj, category]
            }
            print(f"🔍 Searching for category: {category} (as ObjectId: {category_obj})")
        except:
            # If not a valid ObjectId, search as string only
            query["service_categories"] = {"$in": [category]}
            print(f"🔍 Searching for category: {category} (as string)")
    
    if min_rating:
        query["average_rating"] = {"$gte": min_rating}
    
    # ✅ Debug logging
    print(f"🔍 Full search query: {query}")
    print(f"📍 Location: lat={lat}, lng={lng}, radius={radius}km")
    
    skip = (page - 1) * limit
    
    # ✅ First, let's see ALL servicers to debug
    all_servicers = await db[Collections.SERVICERS].find(
        {"verification_status": VerificationStatus.APPROVED}
    ).to_list(100)
    
    print(f"📊 Total approved servicers in DB: {len(all_servicers)}")
    for s in all_servicers[:3]:  # Print first 3 for debugging
        print(f"  - Servicer {s.get('_id')}: categories={s.get('service_categories')}")
    
    servicers = await db[Collections.SERVICERS].find(query).skip(skip).limit(limit).to_list(limit)
    
    print(f"📊 Found {len(servicers)} servicers matching query")
    
    result = []
    for servicer in servicers:
        # Fetch user from users collection
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        if not user:
            print(f"  ⚠️ User not found for servicer {servicer['_id']}")
            continue
        
        # Build clean servicer data with all ObjectIds converted to strings
        servicer_data = {
            '_id': str(servicer['_id']),
            'user_id': str(servicer['user_id']),
            'user_name': user.get('name', ''),
            'user_email': user.get('email', ''),
            'user_phone': user.get('phone', ''),
            'profile_image_url': user.get('profile_image_url', ''),
            'service_categories': [
                str(cat) if isinstance(cat, ObjectId) else cat 
                for cat in servicer.get('service_categories', [])
            ],
            'experience_years': servicer.get('experience_years', 0),
            'verification_status': servicer.get('verification_status'),
            'average_rating': float(servicer.get('average_rating', 0.0)),
            'total_ratings': servicer.get('total_ratings', 0),
            'total_jobs_completed': servicer.get('total_jobs_completed', 0),
            'service_radius_km': float(servicer.get('service_radius_km', 10.0)),
            'availability_status': servicer.get('availability_status', 'offline'),
        }
        
        # Calculate distance if coordinates provided
        if lat and lng and user.get('latitude') and user.get('longitude'):
            try:
                distance = calculate_distance(lat, lng, user['latitude'], user['longitude'])
                servicer_data['distance_km'] = round(distance, 2)
                
                # Filter by radius
                if distance > radius:
                    print(f"  ⏭️ Skipping {user.get('name')} - distance {distance}km > radius {radius}km")
                    continue
                else:
                    print(f"  ✅ Including {user.get('name')} - distance {distance}km")
                    
            except Exception as e:
                print(f"  ⚠️ Distance calculation error for {user.get('name')}: {e}")
                pass
        else:
            # If no location provided, include all servicers
            servicer_data['distance_km'] = None
            print(f"  ✅ Including {user.get('name')} - no location filter")
        
        result.append(servicer_data)
    
    print(f"✅ Returning {len(result)} servicers after distance filter")
    if len(result) > 0:
        print(f"   First servicer: {result[0]['user_name']} with categories: {result[0]['service_categories']}")
    
    total = await db[Collections.SERVICERS].count_documents(query)
    
    return {
        "servicers": result,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }
@app.post("/api/payments/check-status/{payment_intent_id}")
async def check_payment_status(
    payment_intent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Check payment status - for polling from frontend
    """
    try:
        # Retrieve from Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Get transaction from database
        transaction = await db[Collections.TRANSACTIONS].find_one({
            "stripe_payment_intent_id": payment_intent_id
        })
        
        if not transaction:
            return {
                "status": payment_intent.status,
                "payment_intent_id": payment_intent_id,
                "in_database": False
            }
        
        return {
            "status": payment_intent.status,
            "payment_intent_id": payment_intent_id,
            "transaction_status": transaction['transaction_status'],
            "amount": payment_intent.amount / 100,
            "currency": payment_intent.currency,
            "in_database": True
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/user/servicers/{servicer_id}")
async def get_servicer_details(servicer_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed servicer profile"""
    try:
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
        if not servicer:
            raise HTTPException(status_code=404, detail="Servicer not found")
        
        # Convert servicer ObjectIds to strings FIRST
        servicer_data = {
            '_id': str(servicer['_id']),
            'user_id': str(servicer['user_id']),
            'service_categories': [str(cat) for cat in servicer.get('service_categories', [])],
            'experience_years': servicer.get('experience_years', 0),
            'verification_status': servicer.get('verification_status'),
            'average_rating': float(servicer.get('average_rating', 0.0)),
            'total_ratings': servicer.get('total_ratings', 0),
            'total_jobs_completed': servicer.get('total_jobs_completed', 0),
            'service_radius_km': float(servicer.get('service_radius_km', 10.0)),
            'availability_status': servicer.get('availability_status', 'offline'),
            'bio': servicer.get('bio', ''),
            'aadhaar_front_url': servicer.get('aadhaar_front_url', ''),
            'aadhaar_back_url': servicer.get('aadhaar_back_url', ''),
            'certificate_urls': servicer.get('certificate_urls', []),
            'vehicle_document_urls': servicer.get('vehicle_document_urls', []),
            'created_at': servicer.get('created_at'),
            'updated_at': servicer.get('updated_at')
        }
        
        # Get user details
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        if user:
            servicer_data['user_name'] = user.get('name', '')
            servicer_data['user_email'] = user.get('email', '')
            servicer_data['user_phone'] = user.get('phone', '')
            servicer_data['profile_image_url'] = user.get('profile_image_url', '')
        else:
            servicer_data['user_name'] = ''
            servicer_data['user_email'] = ''
            servicer_data['user_phone'] = ''
            servicer_data['profile_image_url'] = ''
        
        # Get ratings
        ratings_list = []
        ratings = await db[Collections.RATINGS].find(
            {"servicer_id": ObjectId(servicer_id)}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        for rating in ratings:
            rating_data = {
                '_id': str(rating['_id']),
                'user_id': str(rating['user_id']),
                'servicer_id': str(rating['servicer_id']),
                'booking_id': str(rating['booking_id']),
                'overall_rating': rating.get('overall_rating', 0),
                'review_text': rating.get('review_text', ''),
                'created_at': rating.get('created_at')
            }
            
            # Get user name
            user_obj = await db[Collections.USERS].find_one({"_id": rating['user_id']})
            rating_data['user_name'] = user_obj.get('name', 'Anonymous') if user_obj else 'Anonymous'
            
            ratings_list.append(rating_data)
        
        # Get pricing
        pricing_list = []
        pricing = await db[Collections.SERVICER_PRICING].find(
            {"servicer_id": ObjectId(servicer_id)}
        ).to_list(100)
        
        for price in pricing:
            price_data = {
                '_id': str(price['_id']),
                'servicer_id': str(price['servicer_id']),
                'category_id': str(price['category_id']),
                'price_per_hour': price.get('price_per_hour'),
                'fixed_price': price.get('fixed_price'),
                'additional_charges': price.get('additional_charges', {})
            }
            
            # Get category name
            category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": price['category_id']})
            price_data['category_name'] = category.get('name', '') if category else ''
            
            pricing_list.append(price_data)
        
        servicer_data['ratings'] = ratings_list
        servicer_data['pricing'] = pricing_list
        
        return servicer_data
        
    except Exception as e:
        print(f"Error in get_servicer_details: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# @app.post("/api/user/bookings", response_model=SuccessResponse)
# async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
#     """Create new service booking"""
#     # ... existing code for validation ...
    
#     servicer = await db[Collections.SERVICERS].find_one({
#         "_id": ObjectId(booking_data.servicer_id),
#         "verification_status": VerificationStatus.APPROVED
#     })
#     if not servicer:
#         raise HTTPException(status_code=404, detail="Servicer not found or not verified")
    
#     category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": ObjectId(booking_data.service_category_id)})
#     if not category:
#         raise HTTPException(status_code=404, detail="Service category not found")
    
#     pricing = await db[Collections.SERVICER_PRICING].find_one({
#         "servicer_id": ObjectId(booking_data.servicer_id),
#         "category_id": ObjectId(booking_data.service_category_id)
#     })
    
#     base_amount = pricing.get('fixed_price') if pricing and pricing.get('fixed_price') else category['base_price']
#     platform_fee = calculate_platform_fee(base_amount)
#     servicer_amount = calculate_servicer_amount(base_amount, platform_fee)
    
#     # Create booking
#     booking_dict = booking_data.dict()
#     booking_dict['booking_number'] = generate_booking_number()
#     booking_dict['user_id'] = ObjectId(current_user['_id'])
#     booking_dict['servicer_id'] = ObjectId(booking_data.servicer_id)
#     booking_dict['service_category_id'] = ObjectId(booking_data.service_category_id)
#     booking_dict['service_type'] = category['name']
#     booking_dict['total_amount'] = base_amount
#     booking_dict['platform_fee'] = platform_fee
#     booking_dict['servicer_amount'] = servicer_amount
#     booking_dict['booking_status'] = BookingStatus.PENDING
#     booking_dict['payment_status'] = PaymentStatus.PENDING
#     booking_dict['created_at'] = datetime.utcnow()
#     booking_dict['updated_at'] = datetime.utcnow()
    
#     result = await db[Collections.BOOKINGS].insert_one(booking_dict)
#     booking_id = str(result.inserted_id)
    
#     # Create transaction
#     transaction = {
#         "booking_id": ObjectId(booking_id),
#         "user_id": ObjectId(current_user['_id']),
#         "servicer_id": ObjectId(booking_data.servicer_id),
#         "transaction_type": TransactionType.BOOKING_PAYMENT,
#         "payment_method": booking_data.payment_method,
#         "amount": base_amount,
#         "platform_fee": platform_fee,
#         "servicer_earnings": servicer_amount,
#         "transaction_status": PaymentStatus.PENDING,
#         "created_at": datetime.utcnow(),
#         "updated_at": datetime.utcnow()
#     }
    
#     # Handle different payment methods
#     response_data = {
#         "booking_id": booking_id,
#         "booking_number": booking_dict['booking_number'],
#         "total_amount": base_amount
#     }
    
#     if booking_data.payment_method == PaymentMethod.STRIPE:
#         try:
#             # Create Stripe Payment Intent
#             payment_intent = stripe.PaymentIntent.create(
#                 amount=int(base_amount * 100),  # Convert to paise
#                 currency=settings.STRIPE_CURRENCY,
#                 metadata={
#                     'booking_id': booking_id,
#                     'user_id': current_user['_id'],
#                     'purpose': 'booking_payment'
#                 },
#                 automatic_payment_methods={'enabled': True}
#             )
            
#             # Update transaction with Stripe ID
#             transaction['stripe_payment_intent_id'] = payment_intent.id
#             await db[Collections.TRANSACTIONS].insert_one(transaction)
            
#             response_data['payment'] = {
#                 'client_secret': payment_intent.client_secret,
#                 'payment_intent_id': payment_intent.id,
#                 'publishable_key': settings.STRIPE_PUBLISHABLE_KEY
#             }
            
#         except stripe.error.StripeError as e:
#             # Rollback booking if payment intent creation fails
#             await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
#             raise HTTPException(status_code=400, detail=f"Payment setup failed: {str(e)}")
    
#     elif booking_data.payment_method == PaymentMethod.WALLET:
#         # Check wallet balance
#         wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
        
#         if not wallet or wallet['balance'] < base_amount:
#             await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
#             raise HTTPException(status_code=400, detail=Messages.INSUFFICIENT_BALANCE)
        
#         # Deduct from wallet immediately
#         await db[Collections.WALLETS].update_one(
#             {"user_id": ObjectId(current_user['_id'])},
#             {
#                 "$inc": {"balance": -base_amount, "total_spent": base_amount},
#                 "$set": {"last_transaction_at": datetime.utcnow()}
#             }
#         )
        
#         # Mark transaction as completed
#         transaction['transaction_status'] = PaymentStatus.COMPLETED
#         await db[Collections.TRANSACTIONS].insert_one(transaction)
        
#         # Update booking payment status
#         await db[Collections.BOOKINGS].update_one(
#             {"_id": ObjectId(booking_id)},
#             {"$set": {"payment_status": PaymentStatus.COMPLETED}}
#         )
        
#         response_data['payment'] = {'method': 'wallet', 'status': 'completed'}
    
#     elif booking_data.payment_method == PaymentMethod.CASH:
#         # Cash on service - no immediate payment
#         await db[Collections.TRANSACTIONS].insert_one(transaction)
#         response_data['payment'] = {'method': 'cash', 'status': 'pending'}
    
#     # Send notifications
#     await create_notification(
#         current_user['_id'],
#         NotificationTypes.BOOKING_UPDATE,
#         "Booking Created",
#         f"Your booking #{booking_dict['booking_number']} has been created successfully"
#     )
    
#     servicer_user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
#     await create_notification(
#         str(servicer['user_id']),
#         NotificationTypes.BOOKING_UPDATE,
#         "New Booking Request",
#         f"New booking request from {current_user['name']}"
#     )
    
#     # Emit socket event to servicer
#     await sio.emit(
#         SocketEvents.NEW_BOOKING_REQUEST,
#         {"booking_id": booking_id, "booking_number": booking_dict['booking_number']},
#         room=f"user-{str(servicer['user_id'])}"
#     )
    
#     return SuccessResponse(
#         message=Messages.BOOKING_CREATED,
#         data=response_data
#     )
# Updated create_booking with better Stripe error handling

def convert_objectids(doc):
    """Recursively convert ObjectIds and datetimes to JSON-serializable formats"""
    if isinstance(doc, dict):
        return {k: convert_objectids(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [convert_objectids(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif hasattr(doc, 'isoformat'):  # datetime objects
        return doc.isoformat()
    return doc

@app.get("/api/user/bookings")
async def get_user_bookings(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all user bookings with filters"""
    query = {"user_id": ObjectId(current_user['_id'])}
    
    if status:
        query["booking_status"] = status
    
    skip = (page - 1) * limit
    
    bookings = await db[Collections.BOOKINGS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert all ObjectIds first
    bookings = [convert_objectids(booking) for booking in bookings]
    
    # Then add servicer details
    for booking in bookings:
        # Get servicer details - use string ID after conversion
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
        if servicer:
            user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
            if user:
                booking['servicer_name'] = user.get('name', '')
                booking['servicer_phone'] = user.get('phone', '')
                booking['servicer_image'] = user.get('profile_image_url', '')
    
    total = await db[Collections.BOOKINGS].count_documents(query)
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.get("/api/user/bookings/{booking_id}")
async def get_booking_details(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific booking details"""
    
    # ✅ FIX: Reject reserved words
    if booking_id in ['create', 'stats', 'history']:
        raise HTTPException(
            status_code=404, 
            detail="Invalid booking ID"
        )
    
    # ✅ FIX: Validate ObjectId format
    if not ObjectId.is_valid(booking_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid booking ID format"
        )
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    booking['_id'] = str(booking['_id'])
    booking['user_id'] = str(booking['user_id'])
    booking['servicer_id'] = str(booking['servicer_id'])
    booking['service_category_id'] = str(booking['service_category_id'])
    
    # Get servicer details
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    if servicer:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        booking['servicer_details'] = {
            "name": user.get('name', ''),
            "phone": user.get('phone', ''),
            "email": user.get('email', ''),
            "image": user.get('profile_image_url', ''),
            "rating": servicer.get('average_rating', 0)
        }
    
    # Get tracking data if service is in progress
    if booking['booking_status'] == BookingStatus.IN_PROGRESS:
        tracking = await db[Collections.BOOKING_TRACKING].find_one(
            {"booking_id": ObjectId(booking_id)},
            sort=[("created_at", -1)]
        )
        if tracking:
            tracking['_id'] = str(tracking['_id'])
            tracking['booking_id'] = str(tracking['booking_id'])
            booking['tracking'] = tracking
    
    # Get chat messages count
    messages_count = await db[Collections.CHAT_MESSAGES].count_documents({
        "booking_id": ObjectId(booking_id)
    })
    booking['messages_count'] = messages_count
    
    return booking

@app.post("/api/user/bookings", response_model=SuccessResponse)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    """Create new service booking - WITH DETAILED STRIPE ERROR HANDLING"""
    
    print(f"📥 Booking request from user {current_user['_id']}")
    
    # Validate servicer
    try:
        servicer = await db[Collections.SERVICERS].find_one({
            "_id": ObjectId(booking_data.servicer_id),
            "verification_status": VerificationStatus.APPROVED
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid servicer ID format")
    
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer not found or not verified")
    
    # Validate category
    try:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({
            "_id": ObjectId(booking_data.service_category_id)
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid service category ID format")
    
    if not category:
        raise HTTPException(status_code=404, detail="Service category not found")
    
    # Get pricing
    pricing = await db[Collections.SERVICER_PRICING].find_one({
        "servicer_id": ObjectId(booking_data.servicer_id),
        "category_id": ObjectId(booking_data.service_category_id)
    })
    
    base_amount = pricing.get('fixed_price') if pricing and pricing.get('fixed_price') else category['base_price']
    platform_fee = calculate_platform_fee(base_amount)
    servicer_amount = calculate_servicer_amount(base_amount, platform_fee)
    
    # Create booking
    booking_dict = {
        'booking_number': generate_booking_number(),
        'user_id': ObjectId(current_user['_id']),
        'servicer_id': ObjectId(booking_data.servicer_id),
        'service_category_id': ObjectId(booking_data.service_category_id),
        'service_type': category['name'],
        'booking_date': booking_data.booking_date,
        'booking_time': booking_data.booking_time,
        'service_location': booking_data.service_location,
        'problem_description': booking_data.problem_description,
        'urgency_level': booking_data.urgency_level,
        'payment_method': booking_data.payment_method,
        'total_amount': base_amount,
        'platform_fee': platform_fee,
        'servicer_amount': servicer_amount,
        'booking_status': BookingStatus.PENDING,
        'payment_status': PaymentStatus.PENDING,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = await db[Collections.BOOKINGS].insert_one(booking_dict)
    booking_id = str(result.inserted_id)
    print(f"✅ Booking created: {booking_id}")
    
    # Transaction record
    transaction = {
        "booking_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": ObjectId(booking_data.servicer_id),
        "transaction_type": TransactionType.BOOKING_PAYMENT,
        "payment_method": booking_data.payment_method,
        "amount": base_amount,
        "platform_fee": platform_fee,
        "servicer_earnings": servicer_amount,
        "transaction_status": PaymentStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    response_data = {
        "booking_id": booking_id,
        "booking_number": booking_dict['booking_number'],
        "total_amount": base_amount,
        "payment_method": booking_data.payment_method
    }
    
    # Handle STRIPE payment
    if booking_data.payment_method == PaymentMethod.STRIPE:
        print("💳 Processing Stripe payment...")
        
        # Check 1: Is Stripe installed?
        if not stripe:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            raise HTTPException(
                status_code=503,
                detail="Card payments are currently unavailable. Please select 'Cash on Service' payment method instead."
            )
        
        # Check 2: Is Stripe configured?
        if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY == "your_stripe_secret_key_here":
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            raise HTTPException(
                status_code=503,
                detail="Payment gateway not configured. Please use 'Cash on Service' payment method."
            )
        
        # Try to create payment intent
        try:
            print(f"Creating Payment Intent: Amount={base_amount}, Currency={settings.STRIPE_CURRENCY}")
            
            payment_intent = stripe.PaymentIntent.create(
                amount=int(base_amount * 100),  # Convert to smallest currency unit (paise)
                currency=settings.STRIPE_CURRENCY or "inr",
                metadata={
                    'booking_id': booking_id,
                    'user_id': current_user['_id'],
                    'servicer_id': booking_data.servicer_id,
                    'category': category['name'],
                    'purpose': 'booking_payment'
                },
                description=f"Booking #{booking_dict['booking_number']} - {category['name']}",
                automatic_payment_methods={'enabled': True}
            )
            
            transaction['stripe_payment_intent_id'] = payment_intent.id
            await db[Collections.TRANSACTIONS].insert_one(transaction)
            
            response_data['payment'] = {
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
                'status': payment_intent.status
            }
            
            print(f"✅ Stripe Payment Intent created: {payment_intent.id}")
            
        except stripe.error.AuthenticationError as e:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            print(f"❌ Stripe Authentication Error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Payment authentication failed. Please use 'Cash on Service' payment method."
            )
        
        except stripe.error.InvalidRequestError as e:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            print(f"❌ Stripe Invalid Request: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Payment setup error: {str(e)}. Please use 'Cash on Service' payment method."
            )
        
        except stripe.error.StripeError as e:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            print(f"❌ Stripe Error: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Payment gateway error. Please use 'Cash on Service' payment method."
            )
        
        except Exception as e:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            print(f"❌ Unexpected Error: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail="Payment setup failed. Please use 'Cash on Service' payment method."
            )
    
    # Handle WALLET payment
    elif booking_data.payment_method == PaymentMethod.WALLET:
        print("👛 Processing Wallet payment...")
        
        wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
        
        if not wallet or wallet['balance'] < base_amount:
            await db[Collections.BOOKINGS].delete_one({"_id": ObjectId(booking_id)})
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. Required: ₹{base_amount}, Available: ₹{wallet['balance'] if wallet else 0}"
            )
        
        await db[Collections.WALLETS].update_one(
            {"user_id": ObjectId(current_user['_id'])},
            {
                "$inc": {"balance": -base_amount, "total_spent": base_amount},
                "$set": {"last_transaction_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
            }
        )
        
        transaction['transaction_status'] = PaymentStatus.COMPLETED
        await db[Collections.TRANSACTIONS].insert_one(transaction)
        
        await db[Collections.BOOKINGS].update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"payment_status": PaymentStatus.COMPLETED, "updated_at": datetime.utcnow()}}
        )
        
        response_data['payment'] = {
            'method': 'wallet',
            'status': 'completed',
            'amount_paid': base_amount
        }
        
        print(f"✅ Wallet payment completed")
    
    # Handle CASH payment
    elif booking_data.payment_method == PaymentMethod.CASH:
        print("💵 Cash payment selected")
        
        await db[Collections.TRANSACTIONS].insert_one(transaction)
        
        response_data['payment'] = {
            'method': 'cash',
            'status': 'pending',
            'note': 'Payment will be collected after service completion'
        }
    
    # Send notifications
    try:
        await create_notification(
            current_user['_id'],
            NotificationTypes.BOOKING_UPDATE,
            "Booking Created",
            f"Your booking #{booking_dict['booking_number']} has been created successfully"
        )
        
        await create_notification(
            str(servicer['user_id']),
            NotificationTypes.BOOKING_UPDATE,
            "New Booking Request",
            f"New booking request from {current_user['name']}"
        )
        
        await sio.emit(
            SocketEvents.NEW_BOOKING_REQUEST,
            {
                "booking_id": booking_id,
                "booking_number": booking_dict['booking_number'],
                "user_name": current_user['name']
            },
            room=f"user-{str(servicer['user_id'])}"
        )
    except Exception as e:
        print(f"⚠️ Notification failed: {e}")
    
    print(f"✅ Booking completed: {booking_id}")
    
    return SuccessResponse(
        message="Booking created successfully",
        data=response_data
    )

@app.put("/api/user/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    cancellation_reason: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Cancel booking"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Can only cancel if pending or accepted
    if booking['booking_status'] not in [BookingStatus.PENDING, BookingStatus.ACCEPTED]:
        raise HTTPException(status_code=400, detail=Messages.CANNOT_CANCEL_BOOKING)
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "booking_status": BookingStatus.CANCELLED,
                "cancellation_reason": cancellation_reason,
                "cancelled_by": ObjectId(current_user['_id']),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Process refund if payment was completed
    if booking['payment_status'] == PaymentStatus.COMPLETED:
        if booking['payment_method'] == PaymentMethod.STRIPE:
            # Process Stripe refund
            transaction = await db[Collections.TRANSACTIONS].find_one({"booking_id": ObjectId(booking_id)})
            if transaction and transaction.get('stripe_payment_intent_id'):
                try:
                    refund = stripe.Refund.create(
                        payment_intent=transaction['stripe_payment_intent_id']
                    )
                    
                    # Update transaction
                    await db[Collections.TRANSACTIONS].update_one(
                        {"_id": transaction['_id']},
                        {"$set": {"transaction_status": PaymentStatus.REFUNDED}}
                    )
                except Exception as e:
                    print(f"Refund failed: {e}")
        
        elif booking['payment_method'] == PaymentMethod.WALLET:
            # Refund to wallet
            await db[Collections.WALLETS].update_one(
                {"user_id": ObjectId(current_user['_id'])},
                {"$inc": {"balance": booking['total_amount']}}
            )
    
    # Send notifications
    await create_notification(
        current_user['_id'],
        NotificationTypes.BOOKING_UPDATE,
        "Booking Cancelled",
        f"Your booking #{booking['booking_number']} has been cancelled"
    )
    
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Booking Cancelled",
        f"Booking #{booking['booking_number']} has been cancelled by user"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.BOOKING_CANCELLED,
        {"booking_id": booking_id},
        room=f"user-{str(servicer['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.BOOKING_CANCELLED)

@app.get("/api/user/bookings/{booking_id}/track")
async def track_service(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Get real-time tracking data"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Get latest tracking data
    tracking = await db[Collections.BOOKING_TRACKING].find_one(
        {"booking_id": ObjectId(booking_id)},
        sort=[("created_at", -1)]
    )
    
    if not tracking:
        return {"message": "No tracking data available"}
    
    tracking['_id'] = str(tracking['_id'])
    tracking['booking_id'] = str(tracking['booking_id'])
    
    return tracking

@app.get("/api/user/bookings/{booking_id}/chat")
async def get_chat_messages(
    booking_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get chat messages for booking"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    skip = (page - 1) * limit
    
    messages = await db[Collections.CHAT_MESSAGES].find(
        {
            "booking_id": ObjectId(booking_id),
            "deleted_by": {"$ne": ObjectId(current_user['_id'])}
        }
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    
    for message in messages:
        message['_id'] = str(message['_id'])
        message['booking_id'] = str(message['booking_id'])
        message['sender_id'] = str(message['sender_id'])
        message['receiver_id'] = str(message['receiver_id'])
    
    return {"messages": messages}
@app.post("/api/user/bookings/{booking_id}/chat")
async def send_chat_message(
    booking_id: str,
    receiver_id: str = Form(...),
    message_text: str = Form(...),
    message_type: str = Form("text"),
    current_user: dict = Depends(get_current_user)
):
    """Send chat message - WITH NOTIFICATION"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Create message
    message_dict = {
        "booking_id": ObjectId(booking_id),
        "sender_id": ObjectId(current_user['_id']),
        "receiver_id": ObjectId(receiver_id),
        "message_type": message_type,
        "message_text": message_text,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "is_read": False
    }
    
    result = await db[Collections.CHAT_MESSAGES].insert_one(message_dict)
    
    # Convert ObjectIds to strings for response
    message_dict['_id'] = str(result.inserted_id)
    message_dict['booking_id'] = str(message_dict['booking_id'])
    message_dict['sender_id'] = str(message_dict['sender_id'])
    message_dict['receiver_id'] = str(message_dict['receiver_id'])
    
    # ✅ CREATE NOTIFICATION FOR SERVICER
    try:
        await create_notification(
            receiver_id,
            NotificationTypes.MESSAGE,  # or NotificationTypes.SYSTEM
            f"New Message - Booking #{booking['booking_number']}",
            f"{current_user['name']}: {message_text[:100]}{'...' if len(message_text) > 100 else ''}",
            metadata={
                "booking_id": booking_id,
                "booking_number": booking.get('booking_number'),
                "sender_name": current_user['name'],
                "message_preview": message_text[:100]
            }
        )
        print(f"📢 Notification sent to servicer {receiver_id}")
    except Exception as e:
        print(f"⚠️ Failed to send notification: {e}")
    
    # Emit socket event to receiver
    await sio.emit(
        SocketEvents.RECEIVE_MESSAGE,
        message_dict,
        room=f"user-{receiver_id}"
    )
    
    # Also emit to booking chat room
    await sio.emit(
        'new_message',
        message_dict,
        room=f"booking-chat-{booking_id}"
    )
    
    return message_dict
@app.post("/api/user/bookings/{booking_id}/confirm-payment")
async def confirm_cash_payment(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Confirm cash payment received by servicer"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "payment_method": PaymentMethod.CASH
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Update booking payment status
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"payment_status": PaymentStatus.COMPLETED, "updated_at": datetime.utcnow()}}
    )
    
    # Update transaction
    await db[Collections.TRANSACTIONS].update_one(
        {"booking_id": ObjectId(booking_id)},
        {"$set": {"transaction_status": PaymentStatus.COMPLETED, "updated_at": datetime.utcnow()}}
    )
    
    # Update servicer wallet
    await db[Collections.WALLETS].update_one(
        {"user_id": ObjectId(booking['servicer_id'])},
        {
            "$inc": {
                "balance": booking['servicer_amount'],
                "total_earned": booking['servicer_amount']
            },
            "$set": {"last_transaction_at": datetime.utcnow()}
        }
    )
    
    # Send notification
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.PAYMENT,
        "Payment Received",
        f"Cash payment of ₹{booking['total_amount']} received for booking #{booking['booking_number']}"
    )
    
    return SuccessResponse(message=Messages.PAYMENT_SUCCESS)
@app.post("/api/user/bookings/{booking_id}/rate")
async def rate_servicer(
    booking_id: str,
    overall_rating: int = Form(...),
    review_text: Optional[str] = Form(None),
    quality_rating: Optional[int] = Form(None),
    professionalism_rating: Optional[int] = Form(None),
    punctuality_rating: Optional[int] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit rating and review - Using Form data instead of Pydantic model"""
    print(f"📝 Rating submission for booking {booking_id}")
    print(f"Rating: {overall_rating}, Review: {review_text}")
    
    # Validate rating
    if not (1 <= overall_rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.COMPLETED
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not completed")
    
    # Check if already rated
    existing_rating = await db[Collections.RATINGS].find_one({"booking_id": ObjectId(booking_id)})
    if existing_rating:
        raise HTTPException(status_code=400, detail="You have already rated this service")
    
    # Create rating document
    rating_doc = {
        "booking_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": ObjectId(booking['servicer_id']),
        "overall_rating": overall_rating,
        "review_text": review_text or "",
        "quality_rating": quality_rating or overall_rating,
        "professionalism_rating": professionalism_rating or overall_rating,
        "punctuality_rating": punctuality_rating or overall_rating,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db[Collections.RATINGS].insert_one(rating_doc)
    print(f"✅ Rating created: {result.inserted_id}")
    
    # Update servicer average rating
    ratings = await db[Collections.RATINGS].find({"servicer_id": ObjectId(booking['servicer_id'])}).to_list(1000)
    avg_rating = sum(r['overall_rating'] for r in ratings) / len(ratings) if ratings else overall_rating
    
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(booking['servicer_id'])},
        {
            "$set": {"average_rating": round(avg_rating, 2)},
            "$inc": {"total_ratings": 1}
        }
    )
    
    print(f"📊 Updated servicer average rating to {round(avg_rating, 2)}")
    
    # Send notification
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    if servicer:
        await create_notification(
            str(servicer['user_id']),
            NotificationTypes.RATING,
            "New Rating Received",
            f"You received a {overall_rating} star rating from {current_user['name']}"
        )
    
    return SuccessResponse(
        message="Rating submitted successfully",
        data={
            "rating_id": str(result.inserted_id),
            "overall_rating": overall_rating,
            "average_rating": round(avg_rating, 2)
        }
    )
@app.get("/api/user/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """Get list of favorite servicers"""
    favorites = await db[Collections.FAVORITE_SERVICERS].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).to_list(100)
    
    result = []
    for fav in favorites:
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(fav['servicer_id'])})
        
        # ✅ FIX: Skip if servicer not found
        if not servicer:
            print(f"⚠️ Warning: Favorite servicer {fav['servicer_id']} not found")
            continue
        
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        # ✅ FIX: Skip if user not found
        if not user:
            print(f"⚠️ Warning: User for servicer {servicer['_id']} not found")
            continue
        
        # Convert service_categories ObjectIds to strings
        service_categories = [
            str(cat) if isinstance(cat, ObjectId) else cat 
            for cat in servicer.get('service_categories', [])
        ]
        
        result.append({
            "_id": str(servicer['_id']),
            "name": user.get('name', 'Unknown'),
            "image": user.get('profile_image_url', ''),
            "rating": float(servicer.get('average_rating', 0.0)),
            "jobs_completed": servicer.get('total_jobs_completed', 0),
            "service_categories": service_categories,
            "added_at": fav.get('added_at')
        })
    
    return {"favorites": result}
@app.post("/api/user/favorites/{servicer_id}")
async def add_favorite(servicer_id: str, current_user: dict = Depends(get_current_user)):
    """Add servicer to favorites"""
    # Check if already exists
    existing = await db[Collections.FAVORITE_SERVICERS].find_one({
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": ObjectId(servicer_id)
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    favorite = {
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": ObjectId(servicer_id),
        "added_at": datetime.utcnow()
    }
    
    await db[Collections.FAVORITE_SERVICERS].insert_one(favorite)
    
    return SuccessResponse(message="Added to favorites")

@app.delete("/api/user/favorites/{servicer_id}")
async def remove_favorite(servicer_id: str, current_user: dict = Depends(get_current_user)):
    """Remove servicer from favorites"""
    result = await db[Collections.FAVORITE_SERVICERS].delete_one({
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": ObjectId(servicer_id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found in favorites")
    
    return SuccessResponse(message="Removed from favorites")

@app.get("/api/user/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    """Get wallet balance and transactions"""
    wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Get recent transactions
    transactions = await db[Collections.TRANSACTIONS].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for txn in transactions:
        txn['_id'] = str(txn['_id'])
        txn['user_id'] = str(txn['user_id'])
        if txn.get('booking_id'):
            txn['booking_id'] = str(txn['booking_id'])
        if txn.get('servicer_id'):
            txn['servicer_id'] = str(txn['servicer_id'])
    
    wallet['_id'] = str(wallet['_id'])
    wallet['user_id'] = str(wallet['user_id'])
    wallet['transactions'] = transactions
    
    return wallet

@app.post("/api/user/wallet/add")
async def add_money_to_wallet(
    amount: float = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Add money to wallet via Stripe"""
    if amount < 10:
        raise HTTPException(status_code=400, detail="Minimum amount is ₹10")
    
    if amount > 100000:
        raise HTTPException(status_code=400, detail="Maximum amount is ₹1,00,000")
    
    try:
        # Create Stripe Payment Intent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to paise
            currency=settings.STRIPE_CURRENCY,
            metadata={
                'user_id': current_user['_id'],
                'purpose': 'wallet_topup'
            },
            automatic_payment_methods={'enabled': True}
        )
        
        # Create transaction record
        transaction = {
            "user_id": ObjectId(current_user['_id']),
            "transaction_type": TransactionType.WALLET_TOPUP,
            "payment_method": PaymentMethod.STRIPE,
            "stripe_payment_intent_id": payment_intent.id,
            "amount": amount,
            "transaction_status": PaymentStatus.PENDING,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db[Collections.TRANSACTIONS].insert_one(transaction)
        
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
            "amount": amount
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment setup failed: {str(e)}")


@app.get("/api/user/notifications")
async def get_notifications(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications"""
    skip = (page - 1) * limit
    
    notifications = await db[Collections.NOTIFICATIONS].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for notif in notifications:
        notif['_id'] = str(notif['_id'])
        notif['user_id'] = str(notif['user_id'])
    
    total = await db[Collections.NOTIFICATIONS].count_documents({"user_id": ObjectId(current_user['_id'])})
    unread = await db[Collections.NOTIFICATIONS].count_documents({
        "user_id": ObjectId(current_user['_id']),
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "total": total,
        "unread": unread,
        "page": page,
        "pages": math.ceil(total / limit)
    }

@app.put("/api/user/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    result = await db[Collections.NOTIFICATIONS].update_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(current_user['_id'])
        },
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return SuccessResponse(message="Notification marked as read")

# Add this endpoint in the USER ENDPOINTS section (around line 2500-3000)

@app.delete("/api/user/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(notification_id):
            raise HTTPException(status_code=400, detail="Invalid notification ID format")
        
        # Find and delete the notification
        result = await db[Collections.NOTIFICATIONS].delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(current_user['_id'])
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return SuccessResponse(message="Notification deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return current_user

@app.put("/api/user/profile")
async def update_user_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    pincode: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if name:
        update_data['name'] = name
    if phone:
        update_data['phone'] = phone
    if address_line1:
        update_data['address_line1'] = address_line1
    if address_line2:
        update_data['address_line2'] = address_line2
    if city:
        update_data['city'] = city
    if state:
        update_data['state'] = state
    if pincode:
        update_data['pincode'] = pincode
    
    # Upload profile image - only images allowed
    if profile_image:
        upload_result = await upload_to_cloudinary(
            profile_image, 
            CloudinaryFolders.PROFILES,
            allowed_types=['image/*']  # Only images
        )
        update_data['profile_image_url'] = upload_result['url']
    
    await db[Collections.USERS].update_one(
        {"_id": ObjectId(current_user['_id'])},
        {"$set": update_data}
    )
    
    return SuccessResponse(message=Messages.UPDATED)

@app.get("/api/user/bookings/{booking_id}/live-tracking")
async def get_live_tracking_data(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current live tracking data for user"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Check if tracking is active
    if not booking.get('tracking_started'):
        return {
            "tracking_active": False,
            "message": "Tracking not started yet"
        }
    
    # Get servicer current location
    servicer_location = booking.get('servicer_current_location', {})
    service_location = booking.get('service_location', {})
    
    # Get latest tracking record
    latest_tracking = await db[Collections.BOOKING_TRACKING].find_one(
        {"booking_id": ObjectId(booking_id)},
        sort=[("created_at", -1)]
    )
    
    # Get servicer details
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    servicer_user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
    
    return {
        "tracking_active": True,
        "servicer_arrived": booking.get('servicer_arrived', False),
        "servicer_info": {
            "name": servicer_user.get('name', ''),
            "phone": servicer_user.get('phone', ''),
            "image": servicer_user.get('profile_image_url', ''),
            "rating": servicer.get('average_rating', 0)
        },
        "servicer_location": {
            "lat": servicer_location.get('latitude'),
            "lng": servicer_location.get('longitude'),
            "speed": servicer_location.get('speed'),
            "heading": servicer_location.get('heading'),
            "last_updated": servicer_location.get('updated_at')
        },
        "user_location": {
            "lat": service_location.get('latitude'),
            "lng": service_location.get('longitude')
        },
        "distance_km": latest_tracking.get('distance_remaining_km') if latest_tracking else None,
        "eta_minutes": latest_tracking.get('eta_minutes') if latest_tracking else None,
        "booking_status": booking['booking_status']
    }

# Add this test endpoint to main.py
@app.post("/api/test/start-tracking/{booking_id}")
async def test_start_tracking(booking_id: str):
    """Test endpoint to manually start tracking"""
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "tracking_started": True,
                "tracking_started_at": datetime.utcnow(),
                "servicer_current_location": {
                    "latitude": 17.6868,  # Visakhapatnam coords
                    "longitude": 83.2185,
                    "updated_at": datetime.utcnow()
                }
            }
        }
    )
    return {"message": "Tracking started for testing"}

@app.get("/api/user/bookings/{booking_id}/tracking-history")
async def get_tracking_history(
    booking_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get tracking history (route traveled)"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Get all tracking records
    tracking_records = await db[Collections.BOOKING_TRACKING].find(
        {"booking_id": ObjectId(booking_id)}
    ).sort("created_at", 1).limit(limit).to_list(limit)
    
    route = []
    for record in tracking_records:
        route.append({
            "lat": record['servicer_latitude'],
            "lng": record['servicer_longitude'],
            "timestamp": record['timestamp'],
            "speed": record.get('speed'),
            "distance_km": record.get('distance_remaining_km'),
            "eta_minutes": record.get('eta_minutes')
        })
    
    return {
        "route": route,
        "total_points": len(route)
    }




# ============= ADDITIONAL USER ENDPOINTS =============

# ============= 1. SEARCH & DISCOVERY ENHANCEMENTS =============

@app.get("/api/user/servicers/nearby")
async def get_nearby_servicers(
    latitude: float,
    longitude: float,
    radius: float = 5.0,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get servicers nearby user's location using geospatial query"""
    query = {
        "verification_status": VerificationStatus.APPROVED,
        "availability_status": {"$in": [AvailabilityStatus.AVAILABLE, AvailabilityStatus.BUSY]}
    }
    
    if category:
        query["service_categories"] = category
    
    # Get all servicers and calculate distance
    servicers = await db[Collections.SERVICERS].find(query).to_list(100)
    
    nearby_servicers = []
    for servicer in servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        # Calculate distance if user has location
        if user.get('latitude') and user.get('longitude'):
            distance = calculate_distance(
                latitude, longitude,
                user['latitude'], user['longitude']
            )
            
            if distance <= radius:
                servicer['_id'] = str(servicer['_id'])
                servicer['user_id'] = str(servicer['user_id'])
                servicer['user_name'] = user.get('name', '')
                servicer['profile_image_url'] = user.get('profile_image_url', '')
                servicer['distance_km'] = round(distance, 2)
                servicer['eta_minutes'] = calculate_eta(distance)
                nearby_servicers.append(servicer)
    
    # Sort by distance
    nearby_servicers.sort(key=lambda x: x['distance_km'])
    
    return {
        "servicers": nearby_servicers,
        "total": len(nearby_servicers),
        "search_radius": radius
    }


@app.get("/api/user/servicers/top-rated")
async def get_top_rated_servicers(
    category: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get top rated servicers"""
    query = {
        "verification_status": VerificationStatus.APPROVED,
        "average_rating": {"$gte": 4.0}
    }
    
    if category:
        query["service_categories"] = category
    
    servicers = await db[Collections.SERVICERS].find(query).sort([
        ("average_rating", -1),
        ("total_ratings", -1)
    ]).limit(limit).to_list(limit)
    
    result = []
    for servicer in servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        servicer['_id'] = str(servicer['_id'])
        servicer['user_id'] = str(servicer['user_id'])
        servicer['user_name'] = user.get('name', '')
        servicer['profile_image_url'] = user.get('profile_image_url', '')
        result.append(servicer)
    
    return {"servicers": result}


@app.get("/api/user/servicers/popular")
async def get_popular_servicers(
    category: Optional[str] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get most booked servicers"""
    query = {
        "verification_status": VerificationStatus.APPROVED,
        "total_jobs_completed": {"$gte": 5}
    }
    
    if category:
        query["service_categories"] = category
    
    servicers = await db[Collections.SERVICERS].find(query).sort(
        "total_jobs_completed", -1
    ).limit(limit).to_list(limit)
    
    result = []
    for servicer in servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        servicer['_id'] = str(servicer['_id'])
        servicer['user_id'] = str(servicer['user_id'])
        servicer['user_name'] = user.get('name', '')
        servicer['profile_image_url'] = user.get('profile_image_url', '')
        result.append(servicer)
    
    return {"servicers": result}


@app.get("/api/user/categories")
async def get_all_categories(current_user: dict = Depends(get_current_user)):
    """Get all active service categories"""
    categories = await db[Collections.SERVICE_CATEGORIES].find({
        "is_active": True
    }).to_list(100)
    
    result = []
    for cat in categories:
        # ✅ FIXED: Convert all ObjectIds to strings
        cat_dict = {
            '_id': str(cat['_id']),
            'name': cat.get('name', ''),
            'description': cat.get('description', ''),
            'base_price': cat.get('base_price', 0),
            'icon': cat.get('icon', 'briefcase'),
            'popular': cat.get('popular', False),
            'is_active': cat.get('is_active', True),
            'created_at': cat.get('created_at'),
            'updated_at': cat.get('updated_at')
        }
        
        # Convert created_by ObjectId to string if it exists
        if cat.get('created_by'):
            cat_dict['created_by'] = str(cat['created_by'])
        
        # Count servicers in this category
        servicers_count = await db[Collections.SERVICERS].count_documents({
            "verification_status": VerificationStatus.APPROVED,
            "service_categories": cat['_id']  # Can use ObjectId here for query
        })
        cat_dict['servicers_count'] = servicers_count
        
        result.append(cat_dict)
    
    return {"categories": result}


# Also fix the get_servicers_by_category endpoint:

@app.get("/api/user/categories/{category_id}/servicers")
async def get_servicers_by_category(
    category_id: str,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "rating",  # rating, price, distance, jobs
    current_user: dict = Depends(get_current_user)
):
    """Get all servicers offering a specific category"""
    # Validate category exists
    category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    query = {
        "verification_status": VerificationStatus.APPROVED,
        "service_categories": ObjectId(category_id)  # Query using ObjectId
    }
    
    # Sorting options
    sort_options = {
        "rating": [("average_rating", -1)],
        "jobs": [("total_jobs_completed", -1)],
        "newest": [("created_at", -1)]
    }
    
    sort = sort_options.get(sort_by, [("average_rating", -1)])
    skip = (page - 1) * limit
    
    servicers = await db[Collections.SERVICERS].find(query).sort(sort).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for servicer in servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        if not user:
            continue
        
        # Get pricing for this category
        pricing = await db[Collections.SERVICER_PRICING].find_one({
            "servicer_id": servicer['_id'],
            "category_id": ObjectId(category_id)
        })
        
        # ✅ FIXED: Build clean servicer data with all ObjectIds converted
        servicer_data = {
            '_id': str(servicer['_id']),
            'user_id': str(servicer['user_id']),
            'user_name': user.get('name', ''),
            'user_email': user.get('email', ''),
            'user_phone': user.get('phone', ''),
            'profile_image_url': user.get('profile_image_url', ''),
            'service_categories': [
                str(cat) if isinstance(cat, ObjectId) else cat 
                for cat in servicer.get('service_categories', [])
            ],
            'experience_years': servicer.get('experience_years', 0),
            'verification_status': servicer.get('verification_status'),
            'average_rating': float(servicer.get('average_rating', 0.0)),
            'total_ratings': servicer.get('total_ratings', 0),
            'total_jobs_completed': servicer.get('total_jobs_completed', 0),
            'service_radius_km': float(servicer.get('service_radius_km', 10.0)),
            'availability_status': servicer.get('availability_status', 'offline'),
            'price': pricing.get('fixed_price') if pricing else category.get('base_price')
        }
        
        result.append(servicer_data)
    
    total = await db[Collections.SERVICERS].count_documents(query)
    
    return {
        "servicers": result,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }



# ============= 2. BOOKING MANAGEMENT ENHANCEMENTS =============

@app.post("/api/user/bookings/{booking_id}/reschedule")
async def reschedule_booking(
    booking_id: str,
    new_date: str = Form(...),
    new_time: str = Form(...),
    reason: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Reschedule a booking"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "booking_status": {"$in": [BookingStatus.PENDING, BookingStatus.ACCEPTED]}
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or cannot be rescheduled")
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "booking_date": new_date,
                "booking_time": new_time,
                "reschedule_reason": reason,
                "rescheduled_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notify servicer
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Booking Rescheduled",
        f"Booking #{booking['booking_number']} has been rescheduled to {new_date} at {new_time}"
    )
    
    return SuccessResponse(message="Booking rescheduled successfully")




# ============= 3. PROMO CODE & OFFERS =============

@app.get("/api/user/offers")
async def get_available_offers(current_user: dict = Depends(get_current_user)):
    """Get all available promo codes for user"""
    now = datetime.utcnow()
    
    promo_codes = await db[Collections.PROMO_CODES].find({
        "is_active": True,
        "valid_from": {"$lte": now},
        "valid_until": {"$gte": now},
        "$expr": {"$lt": ["$used_count", "$usage_limit"]}
    }).to_list(100)
    
    for promo in promo_codes:
        promo['_id'] = str(promo['_id'])
        
        # Check if user already used this promo
        usage = await db[Collections.PROMO_USAGE].find_one({
            "user_id": ObjectId(current_user['_id']),
            "promo_code_id": promo['_id']
        })
        promo['already_used'] = bool(usage)
    
    return {"offers": promo_codes}


@app.post("/api/user/promo/validate")
async def validate_promo_code(
    promo_code: str = Form(...),
    booking_amount: float = Form(...),
    category_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Validate promo code before applying"""
    now = datetime.utcnow()
    
    promo = await db[Collections.PROMO_CODES].find_one({
        "code": promo_code.upper(),
        "is_active": True,
        "valid_from": {"$lte": now},
        "valid_until": {"$gte": now}
    })
    
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid or expired promo code")
    
    # Check usage limit
    if promo['used_count'] >= promo['usage_limit']:
        raise HTTPException(status_code=400, detail="Promo code usage limit reached")
    
    # Check if user already used
    usage = await db[Collections.PROMO_USAGE].find_one({
        "user_id": ObjectId(current_user['_id']),
        "promo_code_id": promo['_id']
    })
    
    if usage:
        raise HTTPException(status_code=400, detail="You have already used this promo code")
    
    # Check minimum order amount
    if booking_amount < promo['min_order_amount']:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount of ₹{promo['min_order_amount']} required"
        )
    
    # Check category eligibility
    if category_id and promo['applicable_categories']:
        if category_id not in promo['applicable_categories']:
            raise HTTPException(status_code=400, detail="Promo code not applicable for this service")
    
    # Calculate discount
    if promo['discount_type'] == 'percentage':
        discount = (booking_amount * promo['discount_value']) / 100
        if promo.get('max_discount_amount'):
            discount = min(discount, promo['max_discount_amount'])
    else:  # fixed
        discount = promo['discount_value']
    
    final_amount = max(booking_amount - discount, 0)
    
    return {
        "valid": True,
        "discount_amount": round(discount, 2),
        "final_amount": round(final_amount, 2),
        "promo_details": {
            "code": promo['code'],
            "discount_type": promo['discount_type'],
            "discount_value": promo['discount_value']
        }
    }


# ============= 4. SUPPORT & HELP =============

@app.post("/api/user/support/tickets")
async def create_support_ticket(
    ticket_data: SupportTicketCreate,
    attachments: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Create support ticket"""
    ticket_dict = ticket_data.dict()
    ticket_dict['ticket_number'] = generate_ticket_number()
    ticket_dict['user_id'] = ObjectId(current_user['_id'])
    
    if ticket_data.booking_id:
        ticket_dict['booking_id'] = ObjectId(ticket_data.booking_id)
    
    # Upload attachments
    attachment_urls = []
    if attachments:
        for file in attachments:
            result = await upload_to_cloudinary(file, CloudinaryFolders.SUPPORT)
            attachment_urls.append(result['url'])
    
    ticket_dict['attachments_urls'] = attachment_urls
    ticket_dict['created_at'] = datetime.utcnow()
    ticket_dict['updated_at'] = datetime.utcnow()
    
    result = await db[Collections.SUPPORT_TICKETS].insert_one(ticket_dict)
    
    # Notify admins
    admins = await db[Collections.USERS].find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        await create_notification(
            str(admin['_id']),
            NotificationTypes.SYSTEM,
            "New Support Ticket",
            f"New support ticket #{ticket_dict['ticket_number']} from {current_user['name']}"
        )
    
    return SuccessResponse(
        message="Support ticket created successfully",
        data={"ticket_id": str(result.inserted_id), "ticket_number": ticket_dict['ticket_number']}
    )


@app.get("/api/user/support/tickets")
async def get_user_tickets(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all user support tickets"""
    query = {"user_id": ObjectId(current_user['_id'])}
    
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    tickets = await db[Collections.SUPPORT_TICKETS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for ticket in tickets:
        ticket['_id'] = str(ticket['_id'])
        ticket['user_id'] = str(ticket['user_id'])
        if ticket.get('booking_id'):
            ticket['booking_id'] = str(ticket['booking_id'])
        if ticket.get('assigned_to'):
            ticket['assigned_to'] = str(ticket['assigned_to'])
    
    total = await db[Collections.SUPPORT_TICKETS].count_documents(query)
    
    return {
        "tickets": tickets,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.get("/api/user/support/tickets/{ticket_id}")
async def get_ticket_details(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get support ticket details with replies"""
    ticket = await db[Collections.SUPPORT_TICKETS].find_one({
        "_id": ObjectId(ticket_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket['_id'] = str(ticket['_id'])
    ticket['user_id'] = str(ticket['user_id'])
    
    # Get all replies
    replies = await db[Collections.TICKET_REPLIES].find(
        {"ticket_id": ObjectId(ticket_id)}
    ).sort("created_at", 1).to_list(100)
    
    for reply in replies:
        reply['_id'] = str(reply['_id'])
        reply['ticket_id'] = str(reply['ticket_id'])
        reply['user_id'] = str(reply['user_id'])
        
        # Get user name
        user = await db[Collections.USERS].find_one({"_id": ObjectId(reply['user_id'])})
        reply['user_name'] = user.get('name', 'Support Team') if user else 'Support Team'
    
    ticket['replies'] = replies
    
    return ticket


@app.post("/api/user/support/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    reply_data: TicketReplyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add reply to support ticket"""
    ticket = await db[Collections.SUPPORT_TICKETS].find_one({
        "_id": ObjectId(ticket_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    reply_dict = reply_data.dict()
    reply_dict['ticket_id'] = ObjectId(ticket_id)
    reply_dict['user_id'] = ObjectId(current_user['_id'])
    reply_dict['is_admin_reply'] = False
    reply_dict['created_at'] = datetime.utcnow()
    
    await db[Collections.TICKET_REPLIES].insert_one(reply_dict)
    
    # Update ticket status
    await db[Collections.SUPPORT_TICKETS].update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )
    
    return SuccessResponse(message="Reply added successfully")


@app.get("/api/user/help/faq")
async def get_faq(category: Optional[str] = None):
    """Get frequently asked questions"""
    # You can create an FAQ collection or return static data
    faqs = [
        {
            "category": "booking",
            "question": "How do I book a service?",
            "answer": "Browse servicers, select one, choose date/time, and confirm booking."
        },
        {
            "category": "payment",
            "question": "What payment methods are accepted?",
            "answer": "We accept Stripe cards, wallet, and cash payments."
        },
        {
            "category": "cancellation",
            "question": "Can I cancel my booking?",
            "answer": "Yes, you can cancel bookings that are pending or accepted. Refunds will be processed according to our policy."
        },
        # Add more FAQs
    ]
    
    if category:
        faqs = [faq for faq in faqs if faq['category'] == category]
    
    return {"faqs": faqs}


# 1. SERVICE AVAILABILITY & INSTANT BOOKING
@app.post("/api/user/services/check-instant-availability")
async def check_instant_service_availability(
    category_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    urgency: str = Form("normal"),  # normal, urgent, emergency
    current_user: dict = Depends(get_current_user)
):
    """Check which servicers can reach user location RIGHT NOW"""
    # Find available servicers nearby
    available_servicers = await db[Collections.SERVICERS].find({
        "service_categories": category_id,
        "verification_status": VerificationStatus.APPROVED,
        "availability_status": AvailabilityStatus.AVAILABLE
    }).to_list(50)
    
    instant_available = []
    
    for servicer in available_servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        # Skip if no location
        if not user.get('latitude') or not user.get('longitude'):
            continue
        
        # Calculate distance
        distance = calculate_distance(
            latitude, longitude,
            user['latitude'], user['longitude']
        )
        
        # Check if within service radius
        if distance <= servicer.get('service_radius_km', 10):
            # Calculate ETA
            eta = calculate_eta(distance)
            
            # Check if servicer has active bookings
            active_bookings = await db[Collections.BOOKINGS].count_documents({
                "servicer_id": servicer['_id'],
                "booking_status": {"$in": [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]}
            })
            
            instant_available.append({
                "servicer_id": str(servicer['_id']),
                "name": user.get('name'),
                "phone": user.get('phone'),
                "image": user.get('profile_image_url'),
                "rating": servicer.get('average_rating', 0),
                "jobs_completed": servicer.get('total_jobs_completed', 0),
                "distance_km": round(distance, 2),
                "eta_minutes": eta,
                "is_busy": active_bookings > 0,
                "current_jobs": active_bookings,
                "can_accept_now": active_bookings == 0
            })
    
    # Sort by distance
    instant_available.sort(key=lambda x: x['distance_km'])
    
    return {
        "available_now": len([s for s in instant_available if s['can_accept_now']]),
        "total_nearby": len(instant_available),
        "servicers": instant_available[:10],  # Top 10 nearest
        "urgency_level": urgency,
        "search_radius_km": 10
    }


# 2. SERVICE HISTORY WITH REPEATABLE TEMPLATES
@app.get("/api/user/service-history")
async def get_service_history_with_quick_actions(
    category_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get service history with one-click rebook options"""
    query = {
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.COMPLETED
    }
    
    if category_id:
        query["service_category_id"] = ObjectId(category_id)
    
    skip = (page - 1) * limit
    bookings = await db[Collections.BOOKINGS].find(query).sort(
        "completed_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    history = []
    for booking in bookings:
        # Get servicer info
        servicer = await db[Collections.SERVICERS].find_one({"_id": booking['servicer_id']})
        servicer_user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        # Get rating if exists
        rating = await db[Collections.RATINGS].find_one({"booking_id": booking['_id']})
        
        # Check if servicer is currently available
        is_available_now = servicer.get('availability_status') == AvailabilityStatus.AVAILABLE
        
        history.append({
            "booking_id": str(booking['_id']),
            "booking_number": booking['booking_number'],
            "service_type": booking['service_type'],
            "completed_date": booking['completed_at'],
            "amount_paid": booking['total_amount'],
            "servicer": {
                "id": str(servicer['_id']),
                "name": servicer_user.get('name'),
                "phone": servicer_user.get('phone'),
                "rating": servicer.get('average_rating'),
                "available_now": is_available_now
            },
            "your_rating": rating['overall_rating'] if rating else None,
            "can_rebook": True,
            "service_location": booking['service_location'].get('address')
        })
    
    total = await db[Collections.BOOKINGS].count_documents(query)
    
    return {
        "history": history,
        "total_services": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


# 3. SERVICE COST ESTIMATOR
@app.post("/api/user/services/estimate-cost")
async def estimate_service_cost(
    category_id: str = Form(...),
    service_type: str = Form(...),  # one_time, recurring, subscription
    estimated_hours: Optional[float] = Form(None),
    recurring_frequency: Optional[str] = Form(None),  # daily, weekly, monthly
    materials_needed: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed cost breakdown before booking"""
    category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": ObjectId(category_id)})
    
    if not category:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Base calculations
    base_price = category['base_price']
    
    # For hourly services
    if estimated_hours:
        service_cost = base_price * estimated_hours
    else:
        service_cost = base_price
    
    # Materials markup
    materials_cost = service_cost * 0.15 if materials_needed else 0
    
    # Recurring discount
    recurring_discount = 0
    if service_type == "recurring":
        if recurring_frequency == "daily":
            recurring_discount = service_cost * 0.20  # 20% off
        elif recurring_frequency == "weekly":
            recurring_discount = service_cost * 0.15  # 15% off
        elif recurring_frequency == "monthly":
            recurring_discount = service_cost * 0.10  # 10% off
    
    subtotal = service_cost + materials_cost - recurring_discount
    platform_fee = calculate_platform_fee(subtotal)
    total = subtotal
    
    # Get average market price
    avg_prices = await db[Collections.SERVICER_PRICING].find({
        "category_id": ObjectId(category_id)
    }).to_list(100)
    
    market_avg = sum(p.get('fixed_price', base_price) for p in avg_prices) / len(avg_prices) if avg_prices else base_price
    
    return {
        "breakdown": {
            "base_service_cost": round(service_cost, 2),
            "materials_cost": round(materials_cost, 2),
            "recurring_discount": round(recurring_discount, 2),
            "subtotal": round(subtotal, 2),
            "platform_fee": round(platform_fee, 2),
            "total_estimate": round(total, 2)
        },
        "market_comparison": {
            "your_estimate": round(total, 2),
            "market_average": round(market_avg, 2),
            "savings": round(market_avg - total, 2) if market_avg > total else 0
        },
        "service_details": {
            "category": category['name'],
            "estimated_duration": f"{estimated_hours} hours" if estimated_hours else "TBD",
            "service_type": service_type,
            "includes_materials": materials_needed
        },
        "note": "Actual cost may vary based on servicer rates and specific requirements"
    }


# 4. PROBLEM DIAGNOSIS ASSISTANT
@app.post("/api/user/services/diagnose-problem")
async def diagnose_service_problem(
    category_id: str = Form(...),
    problem_description: str = Form(...),
    problem_images: Optional[List[UploadFile]] = File(None),
    urgency: str = Form("normal"),
    current_user: dict = Depends(get_current_user)
):
    """AI-assisted problem diagnosis to match with right service"""
    # Upload images if provided
    image_urls = []
    if problem_images:
        for img in problem_images:
            result = await upload_to_cloudinary(img, CloudinaryFolders.PROBLEM_DIAGNOSIS)
            image_urls.append(result['url'])
    
    # Save diagnosis request
    diagnosis = {
        "user_id": ObjectId(current_user['_id']),
        "category_id": ObjectId(category_id),
        "problem_description": problem_description,
        "problem_images": image_urls,
        "urgency": urgency,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.PROBLEM_DIAGNOSIS].insert_one(diagnosis)
    
    # Get category info
    category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": ObjectId(category_id)})
    
    # Basic keyword matching for recommendations
    keywords = problem_description.lower()
    
    recommendations = {
        "immediate_action": None,
        "required_service_type": category['name'],
        "estimated_severity": urgency,
        "recommended_servicers": [],
        "safety_warnings": []
    }
    
    # Add safety warnings for urgent issues
    if urgency == "urgent":
        if "leak" in keywords or "water" in keywords:
            recommendations["safety_warnings"].append("Turn off main water supply if possible")
        elif "electric" in keywords or "shock" in keywords:
            recommendations["safety_warnings"].append("Turn off electricity at main breaker")
        elif "gas" in keywords:
            recommendations["safety_warnings"].append("Evacuate immediately and call emergency services")
    
    # Get top rated servicers for this category
    top_servicers = await db[Collections.SERVICERS].find({
        "service_categories": category_id,
        "verification_status": VerificationStatus.APPROVED,
        "average_rating": {"$gte": 4.0}
    }).sort("average_rating", -1).limit(3).to_list(3)
    
    for servicer in top_servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        recommendations["recommended_servicers"].append({
            "servicer_id": str(servicer['_id']),
            "name": user.get('name'),
            "rating": servicer['average_rating'],
            "specialization": category['name'],
            "available": servicer.get('availability_status') == AvailabilityStatus.AVAILABLE
        })
    
    return {
        "diagnosis_id": str(result.inserted_id),
        "problem_summary": problem_description[:200],
        "images_uploaded": len(image_urls),
        "recommendations": recommendations,
        "next_steps": [
            "Review recommended servicers",
            "Request quotes from multiple servicers",
            "Book service with preferred servicer"
        ]
    }


# 5. SERVICER PERFORMANCE TRACKING
@app.get("/api/user/servicers/{servicer_id}/performance")
async def get_servicer_detailed_performance(
    servicer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deep dive into servicer's actual performance metrics"""
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
    
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer not found")
    
    # Get all completed bookings
    bookings = await db[Collections.BOOKINGS].find({
        "servicer_id": ObjectId(servicer_id),
        "booking_status": BookingStatus.COMPLETED
    }).to_list(1000)
    
    if not bookings:
        return {"message": "No completed services yet", "performance": {}}
    
    # Calculate metrics
    total_jobs = len(bookings)
    
    # On-time completion rate
    on_time = sum(1 for b in bookings if b.get('completed_at') and b.get('started_at'))
    on_time_rate = (on_time / total_jobs) * 100 if total_jobs > 0 else 0
    
    # Average job duration
    durations = []
    for b in bookings:
        if b.get('completed_at') and b.get('started_at'):
            duration = (b['completed_at'] - b['started_at']).total_seconds() / 3600
            durations.append(duration)
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Cancellation rate
    cancelled = await db[Collections.BOOKINGS].count_documents({
        "servicer_id": ObjectId(servicer_id),
        "booking_status": BookingStatus.CANCELLED,
        "cancelled_by": servicer['user_id']  # Cancelled by servicer
    })
    
    total_bookings = await db[Collections.BOOKINGS].count_documents({
        "servicer_id": ObjectId(servicer_id)
    })
    
    cancellation_rate = (cancelled / total_bookings) * 100 if total_bookings > 0 else 0
    
    # Response time (time to accept booking)
    accepted_bookings = await db[Collections.BOOKINGS].find({
        "servicer_id": ObjectId(servicer_id),
        "booking_status": {"$in": [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]},
        "accepted_at": {"$exists": True}
    }).to_list(100)
    
    response_times = [
        (b['accepted_at'] - b['created_at']).total_seconds() / 60
        for b in accepted_bookings
    ]
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    
    # Rating breakdown
    ratings = await db[Collections.RATINGS].find({
        "servicer_id": ObjectId(servicer_id)
    }).to_list(1000)
    
    rating_distribution = {
        "5_star": sum(1 for r in ratings if r['overall_rating'] == 5),
        "4_star": sum(1 for r in ratings if r['overall_rating'] == 4),
        "3_star": sum(1 for r in ratings if r['overall_rating'] == 3),
        "2_star": sum(1 for r in ratings if r['overall_rating'] == 2),
        "1_star": sum(1 for r in ratings if r['overall_rating'] == 1)
    }
    
    # Recent performance (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_bookings = [b for b in bookings if b['created_at'] >= thirty_days_ago]
    
    return {
        "servicer_id": servicer_id,
        "overall_metrics": {
            "total_jobs_completed": total_jobs,
            "average_rating": servicer.get('average_rating', 0),
            "total_ratings": len(ratings),
            "on_time_completion_rate": round(on_time_rate, 2),
            "cancellation_rate": round(cancellation_rate, 2),
            "average_response_time_minutes": round(avg_response_time, 2),
            "average_job_duration_hours": round(avg_duration, 2)
        },
        "rating_distribution": rating_distribution,
        "recent_performance_30days": {
            "jobs_completed": len(recent_bookings),
            "average_rating": round(
                sum(r['overall_rating'] for r in ratings if r['created_at'] >= thirty_days_ago) / 
                len([r for r in ratings if r['created_at'] >= thirty_days_ago])
                if [r for r in ratings if r['created_at'] >= thirty_days_ago] else 0,
                2
            )
        },
        "reliability_score": round((on_time_rate + (100 - cancellation_rate)) / 2, 2),
        "quality_indicators": {
            "punctual": on_time_rate > 85,
            "reliable": cancellation_rate < 10,
            "responsive": avg_response_time < 30,
            "highly_rated": servicer.get('average_rating', 0) >= 4.5
        }
    }


# 6. BOOKING ISSUE REPORTING
@app.post("/api/user/bookings/{booking_id}/report-issue")
async def report_booking_issue(
    booking_id: str,
    issue_type: str = Form(...),  # late_arrival, poor_quality, incomplete_work, unprofessional, safety_concern
    description: str = Form(...),
    evidence_images: Optional[List[UploadFile]] = File(None),
    resolution_expected: str = Form(...),  # refund, redo, discount, apology
    current_user: dict = Depends(get_current_user)
):
    """Report issues with service for admin intervention"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Upload evidence
    evidence_urls = []
    if evidence_images:
        for img in evidence_images:
            result = await upload_to_cloudinary(img, CloudinaryFolders.ISSUE_EVIDENCE)
            evidence_urls.append(result['url'])
    
    # Create issue report
    issue = {
        "booking_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": booking['servicer_id'],
        "issue_type": issue_type,
        "description": description,
        "evidence_urls": evidence_urls,
        "resolution_expected": resolution_expected,
        "status": "pending_review",
        "priority": "high" if issue_type == "safety_concern" else "medium",
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.BOOKING_ISSUES].insert_one(issue)
    
    # Notify admins immediately
    admins = await db[Collections.USERS].find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        await create_notification(
            str(admin['_id']),
            NotificationTypes.SYSTEM,
            f"⚠️ Service Issue Reported",
            f"User reported {issue_type} for booking #{booking['booking_number']}"
        )
    
    # If safety concern, also notify servicer
    if issue_type == "safety_concern":
        servicer = await db[Collections.SERVICERS].find_one({"_id": booking['servicer_id']})
        await create_notification(
            str(servicer['user_id']),
            NotificationTypes.SYSTEM,
            "Safety Concern Reported",
            "A safety concern has been reported. Admin will review."
        )
    
    return SuccessResponse(
        message="Issue reported successfully. Admin will review within 24 hours.",
        data={
            "issue_id": str(result.inserted_id),
            "reference_number": f"ISS{datetime.utcnow().strftime('%Y%m%d')}{random.randint(1000, 9999)}",
            "expected_resolution_time": "24-48 hours"
        }
    )


# 7. SERVICE AREA COVERAGE CHECK
@app.post("/api/user/check-service-coverage")
async def check_service_area_coverage(
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Check which services are available in user's area"""
    # Get all active servicers
    servicers = await db[Collections.SERVICERS].find({
        "verification_status": VerificationStatus.APPROVED
    }).to_list(500)
    
    available_services = {}
    servicers_by_category = {}
    
    for servicer in servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        if not user.get('latitude') or not user.get('longitude'):
            continue
        
        distance = calculate_distance(
            latitude, longitude,
            user['latitude'], user['longitude']
        )
        
        # Check if within service radius
        if distance <= servicer.get('service_radius_km', 10):
            for category_id in servicer.get('service_categories', []):
                category = await db[Collections.SERVICE_CATEGORIES].find_one({
                    "_id": ObjectId(category_id)
                })
                
                if category:
                    category_name = category['name']
                    
                    if category_name not in available_services:
                        available_services[category_name] = {
                            "category_id": str(category['_id']),
                            "available": True,
                            "servicer_count": 0,
                            "nearest_distance_km": distance
                        }
                        servicers_by_category[category_name] = []
                    
                    available_services[category_name]["servicer_count"] += 1
                    available_services[category_name]["nearest_distance_km"] = min(
                        available_services[category_name]["nearest_distance_km"],
                        distance
                    )
                    
                    servicers_by_category[category_name].append({
                        "servicer_id": str(servicer['_id']),
                        "name": user.get('name'),
                        "distance_km": round(distance, 2),
                        "rating": servicer.get('average_rating', 0)
                    })
    
    # Get all categories and mark unavailable ones
    all_categories = await db[Collections.SERVICE_CATEGORIES].find({
        "is_active": True
    }).to_list(100)
    
    for category in all_categories:
        if category['name'] not in available_services:
            available_services[category['name']] = {
                "category_id": str(category['_id']),
                "available": False,
                "servicer_count": 0,
                "nearest_distance_km": None
            }
    
    return {
        "location": {
            "address": address,
            "coordinates": {"lat": latitude, "lng": longitude}
        },
        "coverage_summary": {
            "total_services": len(all_categories),
            "available_services": len([s for s in available_services.values() if s['available']]),
            "unavailable_services": len([s for s in available_services.values() if not s['available']])
        },
        "services": available_services,
        "servicers_by_category": servicers_by_category
    }


# 8. SPENDING ANALYTICS
@app.get("/api/user/spending-insights")
async def get_spending_insights(
    period: str = "month",  # week, month, quarter, year
    current_user: dict = Depends(get_current_user)
):
    """Get detailed spending analytics and patterns"""
    # Calculate date range
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Get transactions
    transactions = await db[Collections.TRANSACTIONS].find({
        "user_id": ObjectId(current_user['_id']),
        "transaction_status": PaymentStatus.COMPLETED,
        "created_at": {"$gte": start_date}
    }).to_list(1000)
    
    # Get completed bookings
    bookings = await db[Collections.BOOKINGS].find({
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.COMPLETED,
        "created_at": {"$gte": start_date}
    }).to_list(1000)
    
    # Calculate totals
    total_spent = sum(t['amount'] for t in transactions if t['transaction_type'] == TransactionType.BOOKING_PAYMENT)
    
    # Spending by category
    category_spending = {}
    for booking in bookings:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({
            "_id": booking['service_category_id']
        })
        
        if category:
            cat_name = category['name']
            category_spending[cat_name] = category_spending.get(cat_name, 0) + booking['total_amount']
    
    # Monthly trend
    monthly_spending = {}
    for txn in transactions:
        month_key = txn['created_at'].strftime("%Y-%m")
        monthly_spending[month_key] = monthly_spending.get(month_key, 0) + txn['amount']
    
    # Most used servicer
    servicer_frequency = {}
    for booking in bookings:
        servicer_id = str(booking['servicer_id'])
        servicer_frequency[servicer_id] = servicer_frequency.get(servicer_id, 0) + 1
    
    most_used_servicer_id = max(servicer_frequency, key=servicer_frequency.get) if servicer_frequency else None
    
    most_used_servicer = None
    if most_used_servicer_id:
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(most_used_servicer_id)})
        servicer_user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        most_used_servicer = {
            "name": servicer_user.get('name'),
            "times_used": servicer_frequency[most_used_servicer_id]
        }
    
    return {
        "period": period,
        "date_range": {
            "from": start_date.isoformat(),
            "to": now.isoformat()
        },
        "summary": {
            "total_spent": round(total_spent, 2),
            "total_services": len(bookings),
            "average_per_service": round(total_spent / len(bookings), 2) if bookings else 0,
            "most_expensive_service": max([b['total_amount'] for b in bookings]) if bookings else 0
        },
        "spending_by_category": category_spending,
        "monthly_trend": monthly_spending,
        "most_used_servicer": most_used_servicer,
        "recommendations": {
            "potential_savings": round(total_spent * 0.15, 2),  # 15% potential savings with better planning
            "tip": "Book services during off-peak hours for better rates"
        }
    }


# 9. SERVICE REMINDERS & MAINTENANCE SCHEDULE
@app.post("/api/user/maintenance/schedule")
async def schedule_maintenance_reminder(
    category_id: str = Form(...),
    service_name: str = Form(...),
    frequency: str = Form(...),  # weekly, monthly, quarterly, yearly
    preferred_servicer_id: Optional[str] = Form(None),
    next_service_date: str = Form(...),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Schedule recurring service reminders (AC maintenance, pest control, etc.)"""
    reminder = {
        "user_id": ObjectId(current_user['_id']),
        "category_id": ObjectId(category_id),
        "service_name": service_name,
        "frequency": frequency,
        "preferred_servicer_id": ObjectId(preferred_servicer_id) if preferred_servicer_id else None,
        "next_service_date": datetime.fromisoformat(next_service_date),
        "notes": notes,
        "is_active": True,
        "reminders_sent": 0,
        "services_completed": 0,
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.MAINTENANCE_REMINDERS].insert_one(reminder)
    
    return SuccessResponse(
        message=f"Maintenance reminder set for {service_name}",
        data={
            "reminder_id": str(result.inserted_id),
            "next_reminder": next_service_date,
            "frequency": frequency
        }
    )


@app.get("/api/user/maintenance/upcoming")
async def get_upcoming_maintenance(current_user: dict = Depends(get_current_user)):
    """Get all upcoming maintenance reminders"""
    reminders = await db[Collections.MAINTENANCE_REMINDERS].find({
        "user_id": ObjectId(current_user['_id']),
        "is_active": True
    }).sort("next_service_date", 1).to_list(100)
    
    upcoming = []
    for reminder in reminders:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({
            "_id": reminder['category_id']
        })
        
        days_until = (reminder['next_service_date'] - datetime.utcnow()).days
        
        upcoming.append({
            "reminder_id": str(reminder['_id']),
            "service_name": reminder['service_name'],
            "category": category['name'] if category else "Unknown",
            "next_date": reminder['next_service_date'].strftime("%Y-%m-%d"),
            "days_until": days_until,
            "status": "overdue" if days_until < 0 else "upcoming" if days_until <= 7 else "scheduled",
            "frequency": reminder['frequency']
        })
    
    return {
        "upcoming_maintenance": upcoming,
        "overdue": len([u for u in upcoming if u['status'] == "overdue"]),
        "this_week": len([u for u in upcoming if u['status'] == "upcoming"])
    }


# 10. MULTI-SERVICE BOOKING (Bundle Services)
@app.post("/api/user/bookings/bundle")
async def create_bundle_booking(
    services: List[dict] = Form(...),  # [{"category_id": "...", "description": "..."}]
    booking_date: str = Form(...),
    booking_time: str = Form(...),
    service_location: dict = None,
    payment_method: PaymentMethod = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Book multiple services at once (e.g., plumbing + electrical + carpentry)"""
    if len(services) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 services per bundle")
    
    bundle_bookings = []
    total_cost = 0
    
    for service in services:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({
            "_id": ObjectId(service['category_id'])
        })
        
        if not category:
            continue
        
        # Find available servicer for this category
        available_servicer = await db[Collections.SERVICERS].find_one({
            "service_categories": service['category_id'],
            "verification_status": VerificationStatus.APPROVED,
            "availability_status": AvailabilityStatus.AVAILABLE
        })
        
        if not available_servicer:
            bundle_bookings.append({
                "service": category['name'],
                "status": "no_servicer_available",
                "amount": category['base_price']
            })
            continue
        
        # Create individual booking
        booking_number = generate_booking_number()
        
        booking = {
            "booking_number": booking_number,
            "user_id": ObjectId(current_user['_id']),
            "servicer_id": available_servicer['_id'],
            "service_category_id": ObjectId(service['category_id']),
            "service_type": category['name'],
            "booking_date": booking_date,
            "booking_time": booking_time,
            "service_location": service_location,
            "problem_description": service.get('description', ''),
            "urgency_level": UrgencyLevel.MEDIUM,
            "payment_method": payment_method,
            "payment_status": PaymentStatus.PENDING,
            "booking_status": BookingStatus.PENDING,
            "total_amount": category['base_price'],
            "platform_fee": calculate_platform_fee(category['base_price']),
            "servicer_amount": calculate_servicer_amount(category['base_price'], calculate_platform_fee(category['base_price'])),
            "is_bundle": True,
            "bundle_discount": 0.10,  # 10% off for bundle
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db[Collections.BOOKINGS].insert_one(booking)
        
        bundle_bookings.append({
            "booking_id": str(result.inserted_id),
            "booking_number": booking_number,
            "service": category['name'],
            "servicer_id": str(available_servicer['_id']),
            "status": "pending",
            "amount": category['base_price']
        })
        
        total_cost += category['base_price']
        
        # Notify servicer
        await create_notification(
            str(available_servicer['user_id']),
            NotificationTypes.BOOKING_UPDATE,
            "New Bundle Booking",
            f"You have a new booking as part of a bundle service"
        )
    
    # Apply bundle discount
    bundle_discount = total_cost * 0.10
    final_total = total_cost - bundle_discount
    
    return SuccessResponse(
        message=f"Bundle booking created with {len(bundle_bookings)} services",
        data={
            "bundle_bookings": bundle_bookings,
            "pricing": {
                "subtotal": total_cost,
                "bundle_discount": bundle_discount,
                "final_total": final_total,
                "savings": bundle_discount
            },
            "note": "Individual servicers will be assigned to each service"
        }
    )


# 11. SERVICE QUALITY GUARANTEE
@app.post("/api/user/bookings/{booking_id}/quality-guarantee")
async def request_quality_guarantee(
    booking_id: str,
    issue_description: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Request redo/refund under quality guarantee (within 7 days of service)"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.COMPLETED
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if within 7 days
    if booking.get('completed_at'):
        days_since = (datetime.utcnow() - booking['completed_at']).days
        if days_since > 7:
            raise HTTPException(status_code=400, detail="Quality guarantee period expired (7 days)")
    
    # Check if already claimed
    existing_claim = await db[Collections.QUALITY_CLAIMS].find_one({
        "booking_id": ObjectId(booking_id)
    })
    
    if existing_claim:
        raise HTTPException(status_code=400, detail="Quality guarantee already claimed for this booking")
    
    # Create quality claim
    claim = {
        "booking_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "servicer_id": booking['servicer_id'],
        "issue_description": issue_description,
        "claim_type": "quality_guarantee",
        "status": "pending_review",
        "resolution": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.QUALITY_CLAIMS].insert_one(claim)
    
    # Notify admin and servicer
    admins = await db[Collections.USERS].find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        await create_notification(
            str(admin['_id']),
            NotificationTypes.SYSTEM,
            "Quality Guarantee Claim",
            f"User filed quality claim for booking #{booking['booking_number']}"
        )
    
    servicer = await db[Collections.SERVICERS].find_one({"_id": booking['servicer_id']})
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.SYSTEM,
        "Quality Concern Raised",
        "A quality concern has been raised for your service"
    )
    
    return SuccessResponse(
        message="Quality guarantee claim submitted",
        data={
            "claim_id": str(result.inserted_id),
            "review_time": "24-48 hours",
            "options": ["Free redo by same servicer", "Free redo by different servicer", "Partial/Full refund"]
        }
    )


# 12. WORK IN PROGRESS UPDATES
@app.get("/api/user/bookings/{booking_id}/progress-updates")
async def get_work_progress_updates(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get real-time work progress updates from servicer"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get progress updates
    updates = await db[Collections.WORK_PROGRESS_UPDATES].find({
        "booking_id": ObjectId(booking_id)
    }).sort("created_at", 1).to_list(100)
    
    progress_timeline = []
    for update in updates:
        progress_timeline.append({
            "update_id": str(update['_id']),
            "status": update['status'],
            "description": update.get('description'),
            "images": update.get('images', []),
            "progress_percentage": update.get('progress_percentage', 0),
            "timestamp": update['created_at'],
            "estimated_completion": update.get('estimated_completion')
        })
    
    return {
        "booking_id": booking_id,
        "booking_number": booking['booking_number'],
        "current_status": booking['booking_status'],
        "progress_updates": progress_timeline,
        "overall_progress": progress_timeline[-1]['progress_percentage'] if progress_timeline else 0
    }

# ============= 5. USER PREFERENCES & SETTINGS =============

@app.get("/api/user/addresses")
async def get_saved_addresses(current_user: dict = Depends(get_current_user)):
    """Get all saved addresses"""
    addresses = await db[Collections.USER_ADDRESSES].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).to_list(100)
    
    for addr in addresses:
        addr['_id'] = str(addr['_id'])
        addr['user_id'] = str(addr['user_id'])
    
    return {"addresses": addresses}


@app.post("/api/user/addresses")
async def add_address(
    address_label: str = Form(...),  # home, work, other
    address_line1: str = Form(...),
    address_line2: Optional[str] = Form(None),
    city: str = Form(...),
    state: str = Form(...),
    pincode: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    is_default: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """Save new address"""
    # If setting as default, unset other defaults
    if is_default:
        await db[Collections.USER_ADDRESSES].update_many(
            {"user_id": ObjectId(current_user['_id'])},
            {"$set": {"is_default": False}}
        )
    
    address = {
        "user_id": ObjectId(current_user['_id']),
        "address_label": address_label,
        "address_line1": address_line1,
        "address_line2": address_line2,
        "city": city,
        "state": state,
        "pincode": pincode,
        "latitude": latitude,
        "longitude": longitude,
        "is_default": is_default,
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.USER_ADDRESSES].insert_one(address)
    
    return SuccessResponse(
        message="Address added successfully",
        data={"address_id": str(result.inserted_id)}
    )


@app.put("/api/user/addresses/{address_id}")
async def update_address(
    address_id: str,
    address_label: Optional[str] = Form(None),
    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    pincode: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    is_default: Optional[bool] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Update saved address"""
    update_data = {}
    
    if address_label: update_data['address_label'] = address_label
    if address_line1: update_data['address_line1'] = address_line1
    if address_line2 is not None: update_data['address_line2'] = address_line2
    if city: update_data['city'] = city
    if state: update_data['state'] = state
    if pincode: update_data['pincode'] = pincode
    if latitude is not None: update_data['latitude'] = latitude
    if longitude is not None: update_data['longitude'] = longitude
    
    if is_default:
        await db[Collections.USER_ADDRESSES].update_many(
            {"user_id": ObjectId(current_user['_id'])},
            {"$set": {"is_default": False}}
        )
        update_data['is_default'] = True
    
    result = await db[Collections.USER_ADDRESSES].update_one(
        {
            "_id": ObjectId(address_id),
            "user_id": ObjectId(current_user['_id'])
        },
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    
    return SuccessResponse(message="Address updated successfully")


@app.delete("/api/user/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    """Delete saved address"""
    result = await db[Collections.USER_ADDRESSES].delete_one({
        "_id": ObjectId(address_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    
    return SuccessResponse(message="Address deleted successfully")


@app.get("/api/user/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """Get user notification and privacy settings"""
    settings = await db[Collections.USER_SETTINGS].find_one(
        {"user_id": ObjectId(current_user['_id'])}
    )
    
    if not settings:
        # Create default settings
        settings = {
            "user_id": ObjectId(current_user['_id']),
            "notifications": {
                "booking_updates": True,
                "promotional": True,
                "chat_messages": True,
                "email": True,
                "push": True
            },
            "privacy": {
                "show_profile_picture": True,
                "show_phone": False,
                "show_address": False
            },
            "language": "en",
            "created_at": datetime.utcnow()
        }
        await db[Collections.USER_SETTINGS].insert_one(settings)
    
    settings['_id'] = str(settings['_id'])
    settings['user_id'] = str(settings['user_id'])
    
    return settings


@app.put("/api/user/settings")
async def update_user_settings(
    notification_settings: Optional[dict] = None,
    privacy_settings: Optional[dict] = None,
    language: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if notification_settings:
        update_data['notifications'] = notification_settings
    if privacy_settings:
        update_data['privacy'] = privacy_settings
    if language:
        update_data['language'] = language
    
    await db[Collections.USER_SETTINGS].update_one(
        {"user_id": ObjectId(current_user['_id'])},
        {"$set": update_data},
        upsert=True
    )
    
    return SuccessResponse(message="Settings updated successfully")


# ============= 6. REFERRAL SYSTEM =============

@app.get("/api/user/referral/code")
async def get_referral_code(current_user: dict = Depends(get_current_user)):
    """Get user's referral code"""
    referral = await db[Collections.REFERRALS].find_one({"user_id": ObjectId(current_user['_id'])})
    
    if not referral:
        # Generate referral code
        referral_code = f"REF{current_user['_id'][:6].upper()}{random.randint(100, 999)}"
        
        referral = {
            "user_id": ObjectId(current_user['_id']),
            "referral_code": referral_code,
            "total_referrals": 0,
            "total_earnings": 0.0,
            "created_at": datetime.utcnow()
        }
        await db[Collections.REFERRALS].insert_one(referral)
    
    # Get referral stats
    referred_users = await db[Collections.REFERRALS].find(
        {"referred_by": ObjectId(current_user['_id'])}
    ).to_list(100)
    
    return {
        "referral_code": referral['referral_code'],
        "total_referrals": len(referred_users),
        "total_earnings": referral.get('total_earnings', 0),
        "referral_bonus": 50,  # ₹50 per referral
        "share_text": f"Join our service platform using my code {referral['referral_code']} and get ₹50 off on your first booking!"
    }


@app.post("/api/user/referral/apply")
async def apply_referral_code(
    referral_code: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Apply referral code (for new users)"""
    # Check if user already used a referral
    existing = await db[Collections.REFERRALS].find_one({"user_id": ObjectId(current_user['_id'])})
    if existing and existing.get('referred_by'):
        raise HTTPException(status_code=400, detail="You have already used a referral code")
    
    # Find referral code owner
    referrer = await db[Collections.REFERRALS].find_one({"referral_code": referral_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Can't use own code
    if str(referrer['user_id']) == current_user['_id']:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    # Apply referral
    await db[Collections.REFERRALS].update_one(
        {"user_id": ObjectId(current_user['_id'])},
        {
            "$set": {
                "referred_by": referrer['user_id'],
                "referral_applied_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Update referrer stats
    await db[Collections.REFERRALS].update_one(
        {"_id": referrer['_id']},
        {"$inc": {"total_referrals": 1}}
    )
    
    # Add bonus to both users' wallets
    bonus_amount = 50.0
    
    # Bonus for new user
    await db[Collections.WALLETS].update_one(
        {"user_id": ObjectId(current_user['_id'])},
        {"$inc": {"balance": bonus_amount}}
    )
    
    # Bonus for referrer
    await db[Collections.WALLETS].update_one(
        {"user_id": referrer['user_id']},
        {"$inc": {"balance": bonus_amount}}
    )
    
    await db[Collections.REFERRALS].update_one(
        {"_id": referrer['_id']},
        {"$inc": {"total_earnings": bonus_amount}}
    )
    
    # Notifications
    await create_notification(
        current_user['_id'],
        NotificationTypes.SYSTEM,
        "Referral Applied",
        f"₹{bonus_amount} added to your wallet as referral bonus!"
    )
    
    referrer_user = await db[Collections.USERS].find_one({"_id": referrer['user_id']})
    await create_notification(
        str(referrer['user_id']),
        NotificationTypes.SYSTEM,
        "Referral Success",
        f"Your referral code was used! ₹{bonus_amount} added to your wallet."
    )
    
    return SuccessResponse(
        message=f"Referral applied! ₹{bonus_amount} added to your wallet",
        data={"bonus_amount": bonus_amount}
    )


@app.get("/api/user/referral/history")
async def get_referral_history(current_user: dict = Depends(get_current_user)):
    """Get list of users referred"""
    referred_users = await db[Collections.REFERRALS].find(
        {"referred_by": ObjectId(current_user['_id'])}
    ).to_list(100)
    
    result = []
    for ref in referred_users:
        user = await db[Collections.USERS].find_one({"_id": ref['user_id']})
        if user:
            result.append({
                "name": user.get('name', 'User'),
                "joined_at": ref.get('referral_applied_at'),
                "bonus_earned": 50.0
            })
    
    return {"referrals": result, "total": len(result)}


# ============= 7. REVIEWS & RATINGS MANAGEMENT =============

@app.get("/api/user/reviews")
async def get_user_reviews(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all reviews given by user"""
    skip = (page - 1) * limit
    
    reviews = await db[Collections.RATINGS].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for review in reviews:
        review['_id'] = str(review['_id'])
        review['user_id'] = str(review['user_id'])
        review['servicer_id'] = str(review['servicer_id'])
        review['booking_id'] = str(review['booking_id'])
        
        # Get servicer details
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(review['servicer_id'])})
        if servicer:
            user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
            review['servicer_name'] = user.get('name', '')
            review['servicer_image'] = user.get('profile_image_url', '')
    
    total = await db[Collections.RATINGS].count_documents({"user_id": ObjectId(current_user['_id'])})
    
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.put("/api/user/reviews/{review_id}")
async def update_review(
    review_id: str,
    overall_rating: Optional[int] = Form(None),
    review_text: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Update existing review"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if overall_rating:
        update_data['overall_rating'] = overall_rating
    if review_text is not None:
        update_data['review_text'] = review_text
    
    result = await db[Collections.RATINGS].update_one(
        {
            "_id": ObjectId(review_id),
            "user_id": ObjectId(current_user['_id'])
        },
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Recalculate servicer rating
    rating_doc = await db[Collections.RATINGS].find_one({"_id": ObjectId(review_id)})
    if rating_doc:
        ratings = await db[Collections.RATINGS].find(
            {"servicer_id": rating_doc['servicer_id']}
        ).to_list(1000)
        avg_rating = sum(r['overall_rating'] for r in ratings) / len(ratings)
        
        await db[Collections.SERVICERS].update_one(
            {"_id": rating_doc['servicer_id']},
            {"$set": {"average_rating": round(avg_rating, 2)}}
        )
    
    return SuccessResponse(message="Review updated successfully")


@app.delete("/api/user/reviews/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a review"""
    rating = await db[Collections.RATINGS].find_one({
        "_id": ObjectId(review_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not rating:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Delete review
    await db[Collections.RATINGS].delete_one({"_id": ObjectId(review_id)})
    
    # Recalculate servicer rating
    ratings = await db[Collections.RATINGS].find(
        {"servicer_id": rating['servicer_id']}
    ).to_list(1000)
    
    if ratings:
        avg_rating = sum(r['overall_rating'] for r in ratings) / len(ratings)
        await db[Collections.SERVICERS].update_one(
            {"_id": rating['servicer_id']},
            {
                "$set": {"average_rating": round(avg_rating, 2)},
                "$inc": {"total_ratings": -1}
            }
        )
    else:
        await db[Collections.SERVICERS].update_one(
            {"_id": rating['servicer_id']},
            {"$set": {"average_rating": 0, "total_ratings": 0}}
        )
    
    return SuccessResponse(message="Review deleted successfully")


# ============= 8. EMERGENCY SERVICES =============

@app.post("/api/user/emergency/request")
async def request_emergency_service(
    category_id: str = Form(...),
    location: dict = None,
    description: str = Form(...),
    contact_number: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Request urgent/emergency service"""
    # Find available servicers nearby
    servicers = await db[Collections.SERVICERS].find({
        "verification_status": VerificationStatus.APPROVED,
        "availability_status": AvailabilityStatus.AVAILABLE,
        "service_categories": category_id
    }).to_list(50)
    
    # Create high priority booking
    booking = {
        "booking_number": generate_booking_number(),
        "user_id": ObjectId(current_user['_id']),
        "service_category_id": ObjectId(category_id),
        "urgency_level": UrgencyLevel.HIGH,
        "booking_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "booking_time": datetime.utcnow().strftime("%H:%M"),
        "service_location": location or {},
        "problem_description": description,
        "contact_number": contact_number,
        "booking_status": BookingStatus.PENDING,
        "payment_status": PaymentStatus.PENDING,
        "is_emergency": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db[Collections.BOOKINGS].insert_one(booking)
    booking_id = str(result.inserted_id)
    
    # Notify all available servicers
    for servicer in servicers:
        await create_notification(
            str(servicer['user_id']),
            NotificationTypes.BOOKING_UPDATE,
            "⚠️ EMERGENCY SERVICE REQUEST",
            f"Urgent service needed: {description[:50]}..."
        )
        
        # Emit socket event
        await sio.emit(
            SocketEvents.EMERGENCY_REQUEST,
            {
                "booking_id": booking_id,
                "booking_number": booking['booking_number'],
                "location": location,
                "description": description
            },
            room=f"user-{str(servicer['user_id'])}"
        )
    
    return SuccessResponse(
        message="Emergency request sent to nearby servicers",
        data={
            "booking_id": booking_id,
            "servicers_notified": len(servicers)
        }
    )


# ============= 9. SCHEDULE MANAGEMENT =============

@app.get("/api/user/schedule")
async def get_user_schedule(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's scheduled bookings"""
    query = {
        "user_id": ObjectId(current_user['_id']),
        "booking_status": {"$in": [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]}
    }
    
    if date:
        query["booking_date"] = date
    
    bookings = await db[Collections.BOOKINGS].find(query).sort("booking_date", 1).to_list(100)
    
    for booking in bookings:
        booking['_id'] = str(booking['_id'])
        booking['user_id'] = str(booking['user_id'])
        booking['servicer_id'] = str(booking['servicer_id'])
        booking['service_category_id'] = str(booking['service_category_id'])
        
        # Get servicer details
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
        if servicer:
            user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
            booking['servicer_name'] = user.get('name', '')
            booking['servicer_phone'] = user.get('phone', '')
    
    return {"schedule": bookings, "total": len(bookings)}


@app.get("/api/user/calendar")
async def get_calendar_view(
    month: int,
    year: int,
    current_user: dict = Depends(get_current_user)
):
    """Get calendar view of bookings for a month"""
    from datetime import date
    import calendar
    
    # Get all bookings for the month
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)
    
    bookings = await db[Collections.BOOKINGS].find({
        "user_id": ObjectId(current_user['_id']),
        "booking_date": {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    }).to_list(500)
    
    # Group by date
    calendar_data = {}
    for booking in bookings:
        booking_date = booking['booking_date']
        if booking_date not in calendar_data:
            calendar_data[booking_date] = []
        
        calendar_data[booking_date].append({
            "booking_id": str(booking['_id']),
            "booking_number": booking['booking_number'],
            "time": booking['booking_time'],
            "status": booking['booking_status'],
            "service_type": booking.get('service_type', '')
        })
    
    return {
        "month": month,
        "year": year,
        "calendar": calendar_data
    }


# ============= 10. TRANSACTION HISTORY =============

@app.get("/api/user/transactions")
async def get_user_transactions(
    type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all user transactions"""
    query = {"user_id": ObjectId(current_user['_id'])}
    
    if type:
        query["transaction_type"] = type
    if status:
        query["transaction_status"] = status
    
    skip = (page - 1) * limit
    
    transactions = await db[Collections.TRANSACTIONS].find(query).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    for txn in transactions:
        txn['_id'] = str(txn['_id'])
        txn['user_id'] = str(txn['user_id'])
        if txn.get('booking_id'):
            txn['booking_id'] = str(txn['booking_id'])
            # Get booking details
            booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(txn['booking_id'])})
            if booking:
                txn['booking_number'] = booking.get('booking_number')
    
    total = await db[Collections.TRANSACTIONS].count_documents(query)
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.get("/api/user/transactions/{transaction_id}")
async def get_transaction_details(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed transaction information"""
    transaction = await db[Collections.TRANSACTIONS].find_one({
        "_id": ObjectId(transaction_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction['_id'] = str(transaction['_id'])
    transaction['user_id'] = str(transaction['user_id'])
    
    if transaction.get('booking_id'):
        transaction['booking_id'] = str(transaction['booking_id'])
        
        # Get booking details
        booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(transaction['booking_id'])})
        if booking:
            transaction['booking_details'] = {
                "booking_number": booking.get('booking_number'),
                "service_type": booking.get('service_type'),
                "booking_date": booking.get('booking_date'),
                "booking_status": booking.get('booking_status')
            }
    
    return transaction


@app.get("/api/user/spending-report")
async def get_spending_report(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    """Get spending report for a date range"""
    from datetime import datetime as dt
    
    start = dt.fromisoformat(start_date)
    end = dt.fromisoformat(end_date)
    
    transactions = await db[Collections.TRANSACTIONS].find({
        "user_id": ObjectId(current_user['_id']),
        "transaction_status": PaymentStatus.COMPLETED,
        "created_at": {"$gte": start, "$lte": end}
    }).to_list(1000)
    
    total_spent = sum(t['amount'] for t in transactions)
    
    # Group by service category
    category_spending = {}
    for txn in transactions:
        if txn.get('booking_id'):
            booking = await db[Collections.BOOKINGS].find_one({"_id": txn['booking_id']})
            if booking:
                category = booking.get('service_type', 'Other')
                category_spending[category] = category_spending.get(category, 0) + txn['amount']
    
    return {
        "period": {"start": start_date, "end": end_date},
        "total_spent": round(total_spent, 2),
        "total_transactions": len(transactions),
        "category_breakdown": category_spending
    }


# ============= 11. WISHLIST / SAVED SERVICES =============

@app.post("/api/user/wishlist")
async def add_to_wishlist(
    category_id: str = Form(...),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Save service to wishlist for future booking"""
    wishlist_item = {
        "user_id": ObjectId(current_user['_id']),
        "category_id": ObjectId(category_id),
        "notes": notes,
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.USER_WISHLIST].insert_one(wishlist_item)
    
    return SuccessResponse(
        message="Added to wishlist",
        data={"wishlist_id": str(result.inserted_id)}
    )


@app.get("/api/user/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    """Get user's wishlist"""
    wishlist = await db[Collections.USER_WISHLIST].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).to_list(100)
    
    result = []
    for item in wishlist:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": item['category_id']})
        if category:
            result.append({
                "_id": str(item['_id']),
                "category_id": str(item['category_id']),
                "category_name": category.get('name'),
                "category_icon": category.get('icon_url'),
                "base_price": category.get('base_price'),
                "notes": item.get('notes'),
                "added_at": item['created_at']
            })
    
    return {"wishlist": result}


@app.delete("/api/user/wishlist/{item_id}")
async def remove_from_wishlist(item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove from wishlist"""
    result = await db[Collections.USER_WISHLIST].delete_one({
        "_id": ObjectId(item_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return SuccessResponse(message="Removed from wishlist")


# ============= 12. QUICK ACTIONS =============

@app.post("/api/user/quick-booking")
async def create_quick_booking(
    servicer_id: str = Form(...),
    category_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Quick booking with favorite servicer"""
    # Get user's default address
    address = await db[Collections.USER_ADDRESSES].find_one({
        "user_id": ObjectId(current_user['_id']),
        "is_default": True
    })
    
    if not address:
        raise HTTPException(status_code=400, detail="Please set a default address first")
    
    # Create booking with today's date and ASAP time
    booking_data = BookingCreate(
        servicer_id=servicer_id,
        service_category_id=category_id,
        booking_date=datetime.utcnow().strftime("%Y-%m-%d"),
        booking_time="ASAP",
        service_location={
            "address": f"{address['address_line1']}, {address['city']}",
            "latitude": address.get('latitude'),
            "longitude": address.get('longitude')
        },
        problem_description="Quick service needed",
        urgency_level=UrgencyLevel.HIGH,
        payment_method=PaymentMethod.CASH
    )
    
    return await create_booking(booking_data, current_user)


@app.post("/api/user/repeat-booking/{booking_id}")
async def repeat_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Repeat a previous booking"""
    old_booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id'])
    })
    
    if not old_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create new booking with same details
    booking_data = BookingCreate(
        servicer_id=str(old_booking['servicer_id']),
        service_category_id=str(old_booking['service_category_id']),
        booking_date=datetime.utcnow().strftime("%Y-%m-%d"),
        booking_time=old_booking['booking_time'],
        service_location=old_booking['service_location'],
        problem_description=old_booking['problem_description'],
        urgency_level=old_booking.get('urgency_level', UrgencyLevel.MEDIUM),
        payment_method=old_booking['payment_method']
    )
    
    return await create_booking(booking_data, current_user)


# Add to config.py SocketEvents:
# EMERGENCY_REQUEST = "emergency_request"

# Add to config.py Collections:
# USER_ADDRESSES = "user_addresses"
# USER_SETTINGS = "user_settings"
# USER_WISHLIST = "user_wishlist"
# ============= ADD TO SOCKET EVENTS =============

@sio.event
async def start_tracking(sid, data):
    """Servicer starts live tracking"""
    booking_id = data.get('booking_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
    
    if booking:
        await sio.emit(
            SocketEvents.TRACKING_STARTED,
            {
                "booking_id": booking_id,
                "servicer_location": {"lat": latitude, "lng": longitude}
            },
            room=f"user-{str(booking['user_id'])}"
        )


@sio.event
async def live_location(sid, data):
    """Real-time location update via socket"""
    booking_id = data.get('booking_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    speed = data.get('speed')
    heading = data.get('heading')
    
    booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
    
    if booking:
        # Calculate distance and ETA
        service_location = booking.get('service_location', {})
        user_lat = service_location.get('latitude')
        user_lng = service_location.get('longitude')
        
        distance_km = None
        eta_minutes = None
        
        if user_lat and user_lng:
            distance_km = calculate_distance(latitude, longitude, user_lat, user_lng)
            actual_speed = speed if speed and speed > 0 else 30
            eta_minutes = calculate_eta(distance_km, actual_speed)
        
        # Emit to user
        await sio.emit(
            SocketEvents.LOCATION_UPDATE,
            {
                "booking_id": booking_id,
                "servicer_location": {
                    "lat": latitude,
                    "lng": longitude,
                    "speed": speed,
                    "heading": heading
                },
                "distance_km": round(distance_km, 2) if distance_km else None,
                "eta_minutes": eta_minutes,
                "timestamp": datetime.utcnow().isoformat()
            },
            room=f"user-{str(booking['user_id'])}"
        )


@sio.event
async def servicer_arrived(sid, data):
    """Servicer marks as arrived"""
    booking_id = data.get('booking_id')
    
    booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
    
    if booking:
        await sio.emit(
            SocketEvents.SERVICER_ARRIVED,
            {"booking_id": booking_id},
            room=f"user-{str(booking['user_id'])}"
        )

# ============= SERVICER ENDPOINTS =============
@app.get("/api/servicer/dashboard")
async def get_servicer_dashboard(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get servicer dashboard overview"""
    servicer_id = ObjectId(servicer['_id'])
    
    # Pending requests
    pending_requests = await db[Collections.BOOKINGS].count_documents({
        "servicer_id": servicer_id,
        "booking_status": BookingStatus.PENDING
    })
    
    # Today's schedule
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    today_bookings = await db[Collections.BOOKINGS].find({
        "servicer_id": servicer_id,
        "booking_status": {"$in": [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]},
        "created_at": {"$gte": today_start, "$lt": today_end}
    }).to_list(100)
    
    # Earnings
    wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
    
    # Ratings
    ratings = servicer.get('average_rating', 0)
    total_ratings = servicer.get('total_ratings', 0)
    
    for booking in today_bookings:
        booking['_id'] = str(booking['_id'])
        booking['user_id'] = str(booking['user_id'])
        booking['servicer_id'] = str(booking['servicer_id'])
        booking['service_category_id'] = str(booking['service_category_id'])
    
    return {
        "pending_requests": pending_requests,
        "today_bookings": today_bookings,
        "wallet_balance": wallet['balance'] if wallet else 0,
        "average_rating": ratings,
        "total_ratings": total_ratings,
        "total_jobs_completed": servicer.get('total_jobs_completed', 0)
    }

@app.post("/api/servicer/documents")
async def upload_servicer_documents(
    aadhaar_front: Optional[UploadFile] = File(None),
    aadhaar_back: Optional[UploadFile] = File(None),
    certificates: Optional[List[UploadFile]] = File(None),
    vehicle_documents: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Upload verification documents"""
    update_data = {"updated_at": datetime.utcnow()}
    
    # ✅ Allow both images and PDFs for documents
    allowed_document_types = ['image/*', 'application/pdf']
    
    # Upload Aadhaar front
    if aadhaar_front:
        result = await upload_to_cloudinary(
            aadhaar_front, 
            CloudinaryFolders.AADHAAR,
            allowed_types=allowed_document_types
        )
        update_data['aadhaar_front_url'] = result['url']
    
    # Upload Aadhaar back
    if aadhaar_back:
        result = await upload_to_cloudinary(
            aadhaar_back, 
            CloudinaryFolders.AADHAAR,
            allowed_types=allowed_document_types
        )
        update_data['aadhaar_back_url'] = result['url']
    
    # Upload certificates
    if certificates:
        certificate_urls = []
        for cert in certificates:
            result = await upload_to_cloudinary(
                cert, 
                CloudinaryFolders.CERTIFICATES,
                allowed_types=allowed_document_types
            )
            certificate_urls.append(result['url'])
        update_data['certificate_urls'] = certificate_urls
    
    # Upload vehicle documents
    if vehicle_documents:
        vehicle_urls = []
        for doc in vehicle_documents:
            result = await upload_to_cloudinary(
                doc, 
                CloudinaryFolders.VEHICLES,
                allowed_types=allowed_document_types
            )
            vehicle_urls.append(result['url'])
        update_data['vehicle_document_urls'] = vehicle_urls
    
    # Update servicer
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$set": update_data}
    )
    
    # Send notification to admin
    admins = await db[Collections.USERS].find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        await create_notification(
            str(admin['_id']),
            NotificationTypes.DOCUMENT_VERIFICATION,
            "New Document Submission",
            f"Servicer {current_user['name']} has submitted documents for verification"
        )
    
    return SuccessResponse(message="Documents uploaded successfully")

@app.get("/api/servicer/documents/status")
async def get_document_status(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get document verification status"""
    return {
        "verification_status": servicer.get('verification_status'),
        "rejection_reason": servicer.get('rejection_reason'),
        "aadhaar_front_url": servicer.get('aadhaar_front_url'),
        "aadhaar_back_url": servicer.get('aadhaar_back_url'),
        "certificate_urls": servicer.get('certificate_urls', []),
        "vehicle_document_urls": servicer.get('vehicle_document_urls', [])
    }

@app.get("/api/servicer/requests")
async def get_service_requests(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get pending booking requests"""
    query = {"servicer_id": ObjectId(servicer['_id'])}
    
    if status:
        query["booking_status"] = status
    else:
        query["booking_status"] = BookingStatus.PENDING
    
    skip = (page - 1) * limit
    
    requests = await db[Collections.BOOKINGS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for req in requests:
        req['_id'] = str(req['_id'])
        req['user_id'] = str(req['user_id'])
        req['servicer_id'] = str(req['servicer_id'])
        req['service_category_id'] = str(req['service_category_id'])
        
        # Get user details
        user = await db[Collections.USERS].find_one({"_id": ObjectId(req['user_id'])})
        if user:
            req['user_name'] = user.get('name', '')
            req['user_phone'] = user.get('phone', '')
            req['user_image'] = user.get('profile_image_url', '')
    
    total = await db[Collections.BOOKINGS].count_documents(query)
    
    return {
        "requests": requests,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.put("/api/servicer/requests/{request_id}/accept")
async def accept_service_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Accept service request"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(request_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.PENDING
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "booking_status": BookingStatus.ACCEPTED,
                "accepted_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification to user
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Booking Accepted",
        f"Your booking #{booking['booking_number']} has been accepted by servicer"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.BOOKING_ACCEPTED,
        {"booking_id": request_id},
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.BOOKING_ACCEPTED)

@app.put("/api/servicer/requests/{request_id}/reject")
async def reject_service_request(
    request_id: str,
    rejection_reason: str = Form(...),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Reject service request"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(request_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.PENDING
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "booking_status": BookingStatus.CANCELLED,
                "cancellation_reason": rejection_reason,
                "cancelled_by": ObjectId(current_user['_id']),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Booking Rejected",
        f"Your booking #{booking['booking_number']} has been rejected by servicer"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.BOOKING_REJECTED,
        {"booking_id": request_id},
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.BOOKING_REJECTED)


@app.get("/api/servicer/services/active")
async def get_active_services(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get ongoing bookings"""
    active_services = await db[Collections.BOOKINGS].find({
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": {"$in": [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]}
    }).to_list(100)
    
    for service in active_services:
        service['_id'] = str(service['_id'])
        service['user_id'] = str(service['user_id'])
        service['servicer_id'] = str(service['servicer_id'])
        service['service_category_id'] = str(service['service_category_id'])
        
        # Get user details
        user = await db[Collections.USERS].find_one({"_id": ObjectId(service['user_id'])})
        if user:
            service['user_name'] = user.get('name', '')
            service['user_phone'] = user.get('phone', '')
    
    return {"active_services": active_services}

# ============= ADD THESE SERVICER ENDPOINTS TO main.py =============
# Add after your existing servicer endpoints (around line 3000-4000)

@app.get("/api/servicer/services/{service_id}")
async def get_service_details_for_servicer(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get service/booking details for servicer"""
    print(f"🔍 Servicer {servicer['_id']} requesting booking {service_id}")
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not booking:
        print(f"❌ Booking {service_id} not found for servicer {servicer['_id']}")
        raise HTTPException(status_code=404, detail="Booking not found or not assigned to you")
    
    print(f"✅ Booking found: {booking.get('booking_number')}")
    
    # Convert ObjectIds to strings
    booking['_id'] = str(booking['_id'])
    booking['user_id'] = str(booking['user_id'])
    booking['servicer_id'] = str(booking['servicer_id'])
    booking['service_category_id'] = str(booking['service_category_id'])
    
    # Get user details
    user = await db[Collections.USERS].find_one({"_id": ObjectId(booking['user_id'])})
    if user:
        booking['user_name'] = user.get('name', '')
        booking['user_phone'] = user.get('phone', '')
        booking['user_email'] = user.get('email', '')
        booking['user_image'] = user.get('profile_image_url', '')
    
    return booking


@app.get("/api/servicer/services/{service_id}/chat")
async def get_servicer_chat_messages(
    service_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get chat messages for servicer"""
    print(f"📨 Servicer requesting chat for booking {service_id}")
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not assigned to you")
    
    skip = (page - 1) * limit
    
    messages = await db[Collections.CHAT_MESSAGES].find(
        {
            "booking_id": ObjectId(service_id),
            "deleted_by": {"$ne": ObjectId(current_user['_id'])}
        }
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    
    print(f"✅ Found {len(messages)} messages")
    
    for message in messages:
        message['_id'] = str(message['_id'])
        message['booking_id'] = str(message['booking_id'])
        message['sender_id'] = str(message['sender_id'])
        message['receiver_id'] = str(message['receiver_id'])
    
    return {"messages": messages}

@app.post("/api/servicer/services/{service_id}/chat")
async def send_servicer_chat_message(
    service_id: str,
    receiver_id: str = Form(...),
    message_text: str = Form(...),
    message_type: str = Form("text"),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Send chat message as servicer - WITH NOTIFICATION"""
    print(f"💬 Servicer sending message to booking {service_id}")
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not assigned to you")
    
    # Create message
    message_dict = {
        "booking_id": ObjectId(service_id),
        "sender_id": ObjectId(current_user['_id']),
        "receiver_id": ObjectId(receiver_id),
        "message_type": message_type,
        "message_text": message_text,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "is_read": False
    }
    
    result = await db[Collections.CHAT_MESSAGES].insert_one(message_dict)
    
    # Convert ObjectIds to strings for response
    message_dict['_id'] = str(result.inserted_id)
    message_dict['booking_id'] = str(message_dict['booking_id'])
    message_dict['sender_id'] = str(message_dict['sender_id'])
    message_dict['receiver_id'] = str(message_dict['receiver_id'])
    
    print(f"✅ Message sent: {result.inserted_id}")
    
    # ✅ CREATE NOTIFICATION FOR USER
    try:
        await create_notification(
            receiver_id,
            NotificationTypes.MESSAGE,  # or create NotificationTypes.MESSAGE
            "New Message from Servicer",
            f"{current_user['name']}: {message_text[:100]}{'...' if len(message_text) > 100 else ''}",
            metadata={
                "booking_id": service_id,
                "booking_number": booking.get('booking_number'),
                "sender_name": current_user['name'],
                "message_preview": message_text[:100]
            }
        )
        print(f"📢 Notification sent to user {receiver_id}")
    except Exception as e:
        print(f"⚠️ Failed to send notification: {e}")
        # Don't fail the message send if notification fails
    
    # Emit socket event to receiver
    await sio.emit(
        SocketEvents.RECEIVE_MESSAGE,
        message_dict,
        room=f"user-{receiver_id}"
    )
    
    # Also emit to booking chat room
    await sio.emit(
        'new_message',
        message_dict,
        room=f"booking-chat-{service_id}"
    )
    
    return message_dict

@app.put("/api/servicer/services/{service_id}/start")
async def start_service(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Mark service as started and generate completion OTP"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.ACCEPTED
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Generate 6-digit OTP
    import random
    import string
    completion_otp = ''.join(random.choices(string.digits, k=6))
    otp_expires_at = datetime.utcnow() + timedelta(hours=24)  # Valid for 24 hours
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "booking_status": BookingStatus.IN_PROGRESS,
                "started_at": datetime.utcnow(),
                "completion_otp": completion_otp,
                "completion_otp_expires_at": otp_expires_at,
                "otp_verified": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification to servicer with OTP
    await create_notification(
        current_user['_id'],
        NotificationTypes.BOOKING_UPDATE,
        "Service Started - Completion OTP",
        f"Your completion OTP for booking #{booking['booking_number']} is: {completion_otp}. Share this with customer when work is done."
    )
    
    # Send notification to user
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Service Started",
        f"Servicer has started working on booking #{booking['booking_number']}"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.SERVICE_STARTED,
        {"booking_id": service_id, "otp_generated": True},
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(
        message="Service started successfully. OTP sent to your notifications.",
        data={"completion_otp": completion_otp}  # Show OTP to servicer immediately
    )

# ============= SERVICE COMPLETION OTP ENDPOINTS =============

@app.get("/api/servicer/services/{service_id}/completion-otp")
async def get_completion_otp(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get completion OTP for active service"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Service not found or not in progress")
    
    completion_otp = booking.get('completion_otp')
    otp_expires_at = booking.get('completion_otp_expires_at')
    
    if not completion_otp:
        raise HTTPException(status_code=404, detail="No OTP generated for this service")
    
    # Check if expired
    if otp_expires_at and datetime.utcnow() > otp_expires_at:
        return {
            "otp": completion_otp,
            "status": "expired",
            "message": "OTP has expired. Please contact support.",
            "booking_number": booking.get('booking_number')
        }
    
    return {
        "otp": completion_otp,
        "status": "active",
        "booking_number": booking.get('booking_number'),
        "expires_at": otp_expires_at.isoformat() if otp_expires_at else None,
        "message": "Share this OTP with customer to complete the service"
    }


@app.post("/api/servicer/services/{service_id}/resend-otp")
async def resend_completion_otp(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Resend completion OTP notification"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Service not found")
    
    completion_otp = booking.get('completion_otp')
    
    if not completion_otp:
        raise HTTPException(status_code=404, detail="No OTP found for this service")
    
    # Send notification again
    await create_notification(
        current_user['_id'],
        NotificationTypes.BOOKING_UPDATE,
        "Completion OTP (Resent)",
        f"Your completion OTP for booking #{booking['booking_number']} is: {completion_otp}"
    )
    
    return SuccessResponse(
        message="OTP sent to your notifications",
        data={"otp": completion_otp}
    )


@app.post("/api/user/bookings/{booking_id}/verify-and-complete")
async def verify_otp_and_complete_service(
    booking_id: str,
    otp: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Verify servicer's OTP and mark service as completed"""
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or service not in progress")
    
    # Check if OTP exists
    completion_otp = booking.get('completion_otp')
    if not completion_otp:
        raise HTTPException(status_code=400, detail=Messages.OTP_NOT_FOUND)
    
    # Check if OTP expired
    otp_expires_at = booking.get('completion_otp_expires_at')
    if otp_expires_at and datetime.utcnow() > otp_expires_at:
        raise HTTPException(status_code=400, detail=Messages.OTP_EXPIRED)
    
    # Verify OTP
    if otp != completion_otp:
        # Log failed attempt
        await db[Collections.BOOKINGS].update_one(
            {"_id": ObjectId(booking_id)},
            {"$inc": {"otp_failed_attempts": 1}}
        )
        
        raise HTTPException(status_code=400, detail=Messages.OTP_INVALID)
    
    # ✅ OTP VERIFIED - Complete the service
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "booking_status": BookingStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "otp_verified": True,
                "otp_verified_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update servicer stats
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(booking['servicer_id'])},
        {"$inc": {"total_jobs_completed": 1}}
    )
    
    # Handle payment
    if booking['payment_status'] == PaymentStatus.COMPLETED:
        await db[Collections.WALLETS].update_one(
            {"user_id": servicer['user_id']},
            {
                "$inc": {
                    "balance": booking['servicer_amount'],
                    "total_earned": booking['servicer_amount']
                },
                "$set": {"last_transaction_at": datetime.utcnow()}
            }
        )
    
    # Send notifications
    await create_notification(
        current_user['_id'],
        NotificationTypes.BOOKING_UPDATE,
        "Service Completed ✅",
        f"Service for booking #{booking['booking_number']} has been completed successfully!"
    )
    
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Service Completed ✅",
        f"Customer verified completion for booking #{booking['booking_number']}. Great job!"
    )
    
    # Emit socket events
    await sio.emit(
        SocketEvents.SERVICE_COMPLETED,
        {"booking_id": booking_id, "verified": True},
        room=f"user-{current_user['_id']}"
    )
    
    await sio.emit(
        SocketEvents.SERVICE_COMPLETED,
        {"booking_id": booking_id, "verified": True},
        room=f"user-{str(servicer['user_id'])}"
    )
    
    servicer_user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
    
    return SuccessResponse(
        message=Messages.SERVICE_COMPLETED_SUCCESS,
        data={
            "booking_id": booking_id,
            "booking_number": booking['booking_number'],
            "completed_at": datetime.utcnow().isoformat(),
            "servicer_name": servicer_user.get('name', '') if servicer_user else ''
        }
    )


@app.post("/api/user/bookings/{booking_id}/request-completion-otp")
async def request_completion_otp_from_servicer(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Send reminder to servicer to share OTP"""
    
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(booking_id),
        "user_id": ObjectId(current_user['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Send notification to servicer
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
    
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Customer Requesting Completion OTP",
        f"Customer is ready to complete booking #{booking['booking_number']}. Please share your completion OTP with them."
    )
    
    # Emit socket
    await sio.emit(
        'otp_requested',
        {
            "booking_id": booking_id,
            "message": "Customer is requesting completion OTP"
        },
        room=f"user-{str(servicer['user_id'])}"
    )
    
    return SuccessResponse(
        message=Messages.OTP_REQUEST_SENT,
        data={"booking_number": booking['booking_number']}
    )


@app.post("/api/servicer/services/{service_id}/location")
async def update_location(
    service_id: str,
    latitude: float = Form(...),
    longitude: float = Form(...),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Update real-time location during service"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Calculate distance and ETA
    service_location = booking.get('service_location', {})
    user_lat = service_location.get('latitude')
    user_lng = service_location.get('longitude')
    
    distance_km = None
    eta_minutes = None
    
    if user_lat and user_lng:
        distance_km = calculate_distance(latitude, longitude, user_lat, user_lng)
        eta_minutes = calculate_eta(distance_km)
    
    # Create tracking record
    tracking = {
        "booking_id": ObjectId(service_id),
        "servicer_latitude": latitude,
        "servicer_longitude": longitude,
        "user_latitude": user_lat,
        "user_longitude": user_lng,
        "distance_remaining_km": distance_km,
        "eta_minutes": eta_minutes,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    await db[Collections.BOOKING_TRACKING].insert_one(tracking)
    
    # Emit socket event to user
    tracking['_id'] = str(tracking['_id'])
    tracking['booking_id'] = str(tracking['booking_id'])
    
    await sio.emit(
        SocketEvents.LOCATION_UPDATE,
        tracking,
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(message="Location updated", data=tracking)

@app.put("/api/servicer/services/{service_id}/complete")
async def complete_service(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Mark service as completed"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": BookingStatus.IN_PROGRESS
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Update booking
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "booking_status": BookingStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update servicer stats
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$inc": {"total_jobs_completed": 1}}
    )
    
    # If payment is cash, wait for user confirmation
    # If payment is stripe and completed, credit servicer wallet
    if booking['payment_status'] == PaymentStatus.COMPLETED and booking['payment_method'] != PaymentMethod.CASH:
        await db[Collections.WALLETS].update_one(
            {"user_id": ObjectId(current_user['_id'])},
            {
                "$inc": {
                    "balance": booking['servicer_amount'],
                    "total_earned": booking['servicer_amount']
                },
                "$set": {"last_transaction_at": datetime.utcnow()}
            }
        )
    
    # Send notification
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Service Completed",
        f"Service for booking #{booking['booking_number']} has been completed"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.SERVICE_COMPLETED,
        {"booking_id": service_id},
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.BOOKING_COMPLETED)

@app.get("/api/servicer/earnings")
async def get_earnings(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get earnings overview"""
    wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
    
    # Get pending payouts
    pending_payouts = await db[Collections.PAYOUT_REQUESTS].find({
        "servicer_id": ObjectId(servicer['_id']),
        "status": "pending"
    }).to_list(100)
    
    pending_amount = sum(p['amount_requested'] for p in pending_payouts)
    
    # Get this month earnings
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    this_month_transactions = await db[Collections.TRANSACTIONS].find({
        "servicer_id": ObjectId(servicer['_id']),
        "transaction_status": PaymentStatus.COMPLETED,
        "created_at": {"$gte": month_start}
    }).to_list(1000)
    
    this_month_earnings = sum(t['servicer_earnings'] for t in this_month_transactions)
    
    return {
        "wallet_balance": wallet['balance'] if wallet else 0,
        "total_earned": wallet['total_earned'] if wallet else 0,
        "pending_payouts": pending_amount,
        "this_month_earnings": this_month_earnings
    }

@app.post("/api/servicer/payout")
async def request_payout(
    payout_data: PayoutRequestCreate,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Request withdrawal to bank/UPI"""
    # Check wallet balance
    wallet = await db[Collections.WALLETS].find_one({"user_id": ObjectId(current_user['_id'])})
    
    if not wallet or wallet['balance'] < payout_data.amount_requested:
        raise HTTPException(status_code=400, detail=Messages.INSUFFICIENT_BALANCE)
    
    if payout_data.amount_requested < settings.MIN_PAYOUT_AMOUNT:
        raise HTTPException(status_code=400, detail=Messages.MIN_PAYOUT_NOT_MET)
    
    # Create payout request
    payout_dict = payout_data.dict()
    payout_dict['servicer_id'] = ObjectId(servicer['_id'])
    payout_dict['status'] = "pending"
    payout_dict['created_at'] = datetime.utcnow()
    payout_dict['updated_at'] = datetime.utcnow()
    
    result = await db[Collections.PAYOUT_REQUESTS].insert_one(payout_dict)
    
    # Deduct from wallet (hold until processed)
    await db[Collections.WALLETS].update_one(
        {"user_id": ObjectId(current_user['_id'])},
        {"$inc": {"balance": -payout_data.amount_requested}}
    )
    
    # Send notification to admins
    admins = await db[Collections.USERS].find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        await create_notification(
            str(admin['_id']),
            NotificationTypes.PAYOUT,
            "New Payout Request",
            f"Servicer {current_user['name']} requested payout of ₹{payout_data.amount_requested}"
        )
    
    return SuccessResponse(
        message=Messages.PAYOUT_REQUESTED,
        data={"payout_id": str(result.inserted_id)}
    )

@app.get("/api/servicer/reviews")
async def get_servicer_reviews(
    rating: Optional[int] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get all reviews"""
    query = {"servicer_id": ObjectId(servicer['_id'])}
    
    if rating:
        query["overall_rating"] = rating
    
    skip = (page - 1) * limit
    
    reviews = await db[Collections.RATINGS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for review in reviews:
        review['_id'] = str(review['_id'])
        review['booking_id'] = str(review['booking_id'])
        review['user_id'] = str(review['user_id'])
        review['servicer_id'] = str(review['servicer_id'])
        
        # Get user details
        user = await db[Collections.USERS].find_one({"_id": ObjectId(review['user_id'])})
        if user:
            review['user_name'] = user.get('name', '')
            review['user_image'] = user.get('profile_image_url', '')
    
    total = await db[Collections.RATINGS].count_documents(query)
    
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }

@app.post("/api/servicer/reviews/{review_id}/respond")
async def respond_to_review(
    review_id: str,
    response: str = Form(...),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Add response to user review"""
    rating = await db[Collections.RATINGS].find_one({
        "_id": ObjectId(review_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not rating:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update rating
    await db[Collections.RATINGS].update_one(
        {"_id": ObjectId(review_id)},
        {
            "$set": {
                "response_from_servicer": response,
                "response_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification to user
    await create_notification(
        str(rating['user_id']),
        NotificationTypes.RATING,
        "Servicer Responded",
        f"Servicer has responded to your review"
    )
    
    return SuccessResponse(message="Response added successfully")

@app.get("/api/servicer/services")
async def get_servicer_services(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get service categories offered with pricing"""
    pricing = await db[Collections.SERVICER_PRICING].find(
        {"servicer_id": ObjectId(servicer['_id'])}
    ).to_list(100)
    
    result = []
    for price in pricing:
        category = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": ObjectId(price['category_id'])})
        if category:
            result.append({
                "_id": str(price['_id']),
                "category_id": str(price['category_id']),
                "category_name": category['name'],
                "price_per_hour": price.get('price_per_hour'),
                "fixed_price": price.get('fixed_price'),
                "additional_charges": price.get('additional_charges')
            })
    
    return {"services": result}

@app.post("/api/servicer/services")
async def add_servicer_service(
    service_data: ServicerPricingCreate,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Add new service category with pricing"""
    # Check if already exists
    existing = await db[Collections.SERVICER_PRICING].find_one({
        "servicer_id": ObjectId(servicer['_id']),
        "category_id": ObjectId(service_data.category_id)
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Service already added")
    
    # Create pricing
    pricing_dict = service_data.dict()
    pricing_dict['servicer_id'] = ObjectId(servicer['_id'])
    pricing_dict['category_id'] = ObjectId(service_data.category_id)
    pricing_dict['created_at'] = datetime.utcnow()
    pricing_dict['updated_at'] = datetime.utcnow()
    
    result = await db[Collections.SERVICER_PRICING].insert_one(pricing_dict)
    
    # Update servicer categories
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$addToSet": {"service_categories": service_data.category_id}}
    )
    
    return SuccessResponse(
        message="Service added successfully",
        data={"service_id": str(result.inserted_id)}
    )

@app.put("/api/servicer/services/{service_id}")
async def update_servicer_service(
    service_id: str,
    price_per_hour: Optional[float] = Form(None),
    fixed_price: Optional[float] = Form(None),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Update service pricing"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if price_per_hour is not None:
        update_data['price_per_hour'] = price_per_hour
    if fixed_price is not None:
        update_data['fixed_price'] = fixed_price
    
    result = await db[Collections.SERVICER_PRICING].update_one(
        {
            "_id": ObjectId(service_id),
            "servicer_id": ObjectId(servicer['_id'])
        },
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return SuccessResponse(message=Messages.UPDATED)

@app.put("/api/servicer/status")
async def update_availability_status(
    status: str = Form(...),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Toggle availability status"""
    if status not in [AvailabilityStatus.AVAILABLE, AvailabilityStatus.BUSY, AvailabilityStatus.OFFLINE]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$set": {"availability_status": status, "updated_at": datetime.utcnow()}}
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.SERVICER_STATUS_CHANGE,
        {"servicer_id": servicer['_id'], "status": status},
        room="admins"
    )
    
    return SuccessResponse(message="Status updated successfully")

@app.get("/api/servicer/profile")
async def get_servicer_profile(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get servicer profile details"""
    
    # Convert all ObjectIds to strings in servicer
    servicer_data = {
        '_id': str(servicer['_id']),
        'user_id': str(servicer['user_id']),
        'service_categories': [str(cat) if isinstance(cat, ObjectId) else cat for cat in servicer.get('service_categories', [])],
        'experience_years': servicer.get('experience_years', 0),
        'verification_status': servicer.get('verification_status'),
        'average_rating': float(servicer.get('average_rating', 0.0)),
        'total_ratings': servicer.get('total_ratings', 0),
        'total_jobs_completed': servicer.get('total_jobs_completed', 0),
        'service_radius_km': float(servicer.get('service_radius_km', 10.0)),
        'availability_status': servicer.get('availability_status', 'offline'),
        'bio': servicer.get('bio', ''),
        'profile_photo_url': servicer.get('profile_photo_url', ''),
        'bank_account_number': servicer.get('bank_account_number', ''),
        'ifsc_code': servicer.get('ifsc_code', ''),
        'upi_id': servicer.get('upi_id', ''),
        'created_at': servicer.get('created_at'),
        'updated_at': servicer.get('updated_at')
    }
    
    # Add user details with converted ObjectIds
    user_details = current_user.copy()
    if '_id' in user_details and isinstance(user_details['_id'], str):
        # Already converted by get_current_user
        pass
    
    servicer_data['user_details'] = user_details
    
    return servicer_data


@app.put("/api/servicer/profile")
async def update_servicer_profile(
    bio: Optional[str] = Form(None),
    experience_years: Optional[int] = Form(None),
    service_radius_km: Optional[float] = Form(None),
    profile_photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Update professional details"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if bio:
        update_data['bio'] = bio
    if experience_years is not None:
        update_data['experience_years'] = experience_years
    if service_radius_km is not None:
        update_data['service_radius_km'] = service_radius_km
    
    if profile_photo:
        # ✅ Only allow images for profile photos
        result = await upload_to_cloudinary(
            profile_photo, 
            CloudinaryFolders.PROFILES,
            allowed_types=['image/*']  # Only images
        )
        update_data['profile_photo_url'] = result['url']
        
        # Also update user profile image
        await db[Collections.USERS].update_one(
            {"_id": ObjectId(current_user['_id'])},
            {"$set": {"profile_image_url": result['url'], "updated_at": datetime.utcnow()}}
        )
    
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$set": update_data}
    )
    
    return SuccessResponse(message=Messages.UPDATED)

@app.put("/api/servicer/bank-details")
async def update_bank_details(
    bank_account_number: Optional[str] = Form(None),
    ifsc_code: Optional[str] = Form(None),
    upi_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Update bank account details for payouts"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if bank_account_number:
        update_data['bank_account_number'] = bank_account_number
    if ifsc_code:
        update_data['ifsc_code'] = ifsc_code
    if upi_id:
        update_data['upi_id'] = upi_id
    
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer['_id'])},
        {"$set": update_data}
    )
    
    return SuccessResponse(message="Bank details updated successfully")


# ============= ADD THESE SERVICER NOTIFICATION ENDPOINTS =============
# Add after your other servicer endpoints (around line 4000-5000)

@app.get("/api/servicer/notifications")
async def get_servicer_notifications(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get all notifications for servicer"""
    skip = (page - 1) * limit
    
    notifications = await db[Collections.NOTIFICATIONS].find(
        {"user_id": ObjectId(current_user['_id'])}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for notif in notifications:
        notif['_id'] = str(notif['_id'])
        notif['user_id'] = str(notif['user_id'])
    
    total = await db[Collections.NOTIFICATIONS].count_documents(
        {"user_id": ObjectId(current_user['_id'])}
    )
    unread = await db[Collections.NOTIFICATIONS].count_documents({
        "user_id": ObjectId(current_user['_id']),
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "total": total,
        "unread": unread,
        "page": page,
        "pages": math.ceil(total / limit)
    }


@app.put("/api/servicer/notifications/{notification_id}/read")
async def mark_servicer_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Mark notification as read for servicer"""
    result = await db[Collections.NOTIFICATIONS].update_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(current_user['_id'])
        },
        {
            "$set": {
                "is_read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return SuccessResponse(message="Notification marked as read")


@app.delete("/api/servicer/notifications/{notification_id}")
async def delete_servicer_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Delete a notification for servicer"""
    try:
        if not ObjectId.is_valid(notification_id):
            raise HTTPException(status_code=400, detail="Invalid notification ID format")
        
        result = await db[Collections.NOTIFICATIONS].delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(current_user['_id'])
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return SuccessResponse(message="Notification deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")


@app.get("/api/servicer/notifications/unread-count")
async def get_servicer_unread_count(
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Get unread notification count for servicer"""
    unread = await db[Collections.NOTIFICATIONS].count_documents({
        "user_id": ObjectId(current_user['_id']),
        "is_read": False
    })
    
    return {"unread_count": unread}

# ============= ADD THESE ENDPOINTS TO YOUR MAIN.PY =============

# Add after other servicer endpoints

# Add this to your servicer endpoints in main.py

@app.post("/api/servicer/services/{service_id}/start-tracking")
async def start_location_tracking(
    service_id: str,
    latitude: float = Form(...),
    longitude: float = Form(...),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Start tracking when servicer begins journey to user location"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "booking_status": {"$in": [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]}
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Update booking with tracking started flag
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "tracking_started": True,
                "tracking_started_at": datetime.utcnow(),
                "servicer_current_location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "updated_at": datetime.utcnow()
                }
            }
        }
    )
    
    # Get user location from booking
    service_location = booking.get('service_location', {})
    user_lat = service_location.get('latitude')
    user_lng = service_location.get('longitude')
    
    # Calculate initial distance and ETA
    distance_km = None
    eta_minutes = None
    
    if user_lat and user_lng:
        distance_km = calculate_distance(latitude, longitude, user_lat, user_lng)
        eta_minutes = calculate_eta(distance_km)
    
    # Create initial tracking record
    tracking = {
        "booking_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "user_id": booking['user_id'],
        "servicer_latitude": latitude,
        "servicer_longitude": longitude,
        "user_latitude": user_lat,
        "user_longitude": user_lng,
        "distance_remaining_km": distance_km,
        "eta_minutes": eta_minutes,
        "status": "on_the_way",
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = await db[Collections.BOOKING_TRACKING].insert_one(tracking)
    
    # Send notification to user
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Servicer On The Way",
        f"Your servicer is on the way. ETA: {eta_minutes} minutes"
    )
    
    # Emit socket event
    await sio.emit(
        SocketEvents.LOCATION_UPDATE,
        {
            "booking_id": service_id,
            "servicer_location": {"lat": latitude, "lng": longitude},
            "user_location": {"lat": user_lat, "lng": user_lng},
            "distance_km": distance_km,
            "eta_minutes": eta_minutes,
            "status": "on_the_way"
        },
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(
        message="Tracking started",
        data={
            "distance_km": distance_km,
            "eta_minutes": eta_minutes,
            "tracking_id": str(result.inserted_id)
        }
    )


@app.post("/api/servicer/services/{service_id}/update-location")
async def update_servicer_location(
    service_id: str,
    latitude: float = Form(...),
    longitude: float = Form(...),
    speed: Optional[float] = Form(None),
    heading: Optional[float] = Form(None),
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Update location during tracking"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    # Get user location
    service_location = booking.get('service_location', {})
    user_lat = service_location.get('latitude')
    user_lng = service_location.get('longitude')
    
    # Calculate distance and ETA
    distance_km = None
    eta_minutes = None
    
    if user_lat and user_lng:
        distance_km = calculate_distance(latitude, longitude, user_lat, user_lng)
        actual_speed = speed if speed and speed > 0 else 30
        eta_minutes = calculate_eta(distance_km, actual_speed)
    
    # Update booking with current location
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "servicer_current_location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "speed": speed,
                    "heading": heading,
                    "updated_at": datetime.utcnow()
                }
            }
        }
    )
    
    # Create tracking record
    tracking = {
        "booking_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id']),
        "user_id": booking['user_id'],
        "servicer_latitude": latitude,
        "servicer_longitude": longitude,
        "user_latitude": user_lat,
        "user_longitude": user_lng,
        "distance_remaining_km": distance_km,
        "eta_minutes": eta_minutes,
        "speed": speed,
        "heading": heading,
        "status": "on_the_way",
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    await db[Collections.BOOKING_TRACKING].insert_one(tracking)
    
    # Emit to user
    await sio.emit(
        SocketEvents.LOCATION_UPDATE,
        {
            "booking_id": service_id,
            "servicer_location": {
                "lat": latitude,
                "lng": longitude,
                "speed": speed,
                "heading": heading
            },
            "distance_km": round(distance_km, 2) if distance_km else None,
            "eta_minutes": eta_minutes,
            "timestamp": datetime.utcnow().isoformat()
        },
        room=f"user-{str(booking['user_id'])}"
    )
    
    return {
        "status": "success",
        "distance_km": distance_km,
        "eta_minutes": eta_minutes
    }


@app.post("/api/servicer/services/{service_id}/arrived")
async def mark_servicer_arrived(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    servicer: dict = Depends(get_current_servicer)
):
    """Mark as arrived at user location"""
    booking = await db[Collections.BOOKINGS].find_one({
        "_id": ObjectId(service_id),
        "servicer_id": ObjectId(servicer['_id'])
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail=Messages.BOOKING_NOT_FOUND)
    
    await db[Collections.BOOKINGS].update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "servicer_arrived": True,
                "arrived_at": datetime.utcnow(),
                "tracking_started": False
            }
        }
    )
    
    await create_notification(
        str(booking['user_id']),
        NotificationTypes.BOOKING_UPDATE,
        "Servicer Arrived",
        "Your servicer has arrived at your location"
    )
    
    await sio.emit(
        SocketEvents.SERVICER_ARRIVED,
        {"booking_id": service_id},
        room=f"user-{str(booking['user_id'])}"
    )
    
    return SuccessResponse(message="Marked as arrived")

# ============= ADMIN ENDPOINTS =============

# Add this endpoint - No authentication required for first-time setup
@app.post("/api/auth/create-first-admin", response_model=SuccessResponse)
async def create_first_admin(
    name: str = Form(...),
    email: EmailStr = Form(...),
    password: str = Form(...),
    secret_setup_key: str = Form(...)
):
    """Create first admin account - One-time setup"""
    # Security: Check secret key (set this in your .env or config)
    if secret_setup_key != "ADMIN_SETUP_SECRET_2024":
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    # Check if any admin already exists
    existing_admin = await db[Collections.USERS].find_one({"role": UserRole.ADMIN})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin account already exists. Use regular login.")
    
    # Check if email exists
    existing_user = await db[Collections.USERS].find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create admin user - NO EMAIL VERIFICATION REQUIRED
    admin_dict = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "phone": "0000000000",
        "role": UserRole.ADMIN,
        "email_verified": True,  # Auto-verified for admin
        "is_active": True,
        "is_blocked": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db[Collections.USERS].insert_one(admin_dict)
    admin_id = str(result.inserted_id)
    
    # Create wallet for admin
    wallet = {
        "user_id": ObjectId(admin_id),
        "balance": 0.0,
        "total_earned": 0.0,
        "total_spent": 0.0,
        "currency": "INR",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db[Collections.WALLETS].insert_one(wallet)
    
    return SuccessResponse(
        message="Admin account created successfully. You can now login.",
        data={"admin_id": admin_id, "email": email}
    )


# Admin Login Endpoint (same as regular login but clearer)
@app.post("/api/auth/admin-login", response_model=Token)
async def admin_login(credentials: UserLogin):
    """Admin login - same as regular login"""
    # Find user
    user = await db[Collections.USERS].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail=Messages.INVALID_CREDENTIALS)
    
    # Check if user is admin
    if user['role'] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin access only.")
    
    if user.get('is_blocked'):
        raise HTTPException(status_code=403, detail=Messages.ACCOUNT_BLOCKED)
    
    # Update last login
    await db[Collections.USERS].update_one(
        {"_id": user['_id']},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user['_id']), "role": user['role']})
    
    user['_id'] = str(user['_id'])
    user.pop('password_hash', None)
    
    return Token(
        access_token=access_token,
        user=user
    )
@app.get("/api/admin/dashboard")
async def get_admin_dashboard(current_admin: dict = Depends(get_current_admin)):
    """Platform statistics"""
    # Total users
    total_users = await db[Collections.USERS].count_documents({"role": UserRole.USER})
    total_servicers = await db[Collections.SERVICERS].count_documents({})
    
    # Total bookings
    total_bookings = await db[Collections.BOOKINGS].count_documents({})
    
    # Pending verifications
    pending_verifications = await db[Collections.SERVICERS].count_documents({
        "verification_status": VerificationStatus.PENDING
    })
    
    # Total revenue
    completed_transactions = await db[Collections.TRANSACTIONS].find({
        "transaction_status": PaymentStatus.COMPLETED,
        "transaction_type": TransactionType.BOOKING_PAYMENT
    }).to_list(10000)
    
    total_revenue = sum(t['amount'] for t in completed_transactions)
    platform_fees = sum(t['platform_fee'] for t in completed_transactions)
    
    # Pending payouts
    pending_payouts = await db[Collections.PAYOUT_REQUESTS].find({
        "status": "pending"
    }).to_list(1000)
    
    pending_payout_amount = sum(p['amount_requested'] for p in pending_payouts)
    
    return {
        "total_users": total_users,
        "total_servicers": total_servicers,
        "total_bookings": total_bookings,
        "pending_verifications": pending_verifications,
        "total_revenue": total_revenue,
        "platform_fees_collected": platform_fees,
        "pending_payouts": len(pending_payouts),
        "pending_payout_amount": pending_payout_amount
    }

# Replace the get_pending_verifications endpoint in main.py with this:

@app.get("/api/admin/verifications")
async def get_pending_verifications(current_admin: dict = Depends(get_current_admin)):
    """Get all servicers with pending document verification"""
    servicers = await db[Collections.SERVICERS].find({
        "verification_status": VerificationStatus.PENDING
    }).to_list(100)
    
    result = []
    for servicer in servicers:
        # Fetch user from users collection
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        
        # ✅ FIXED: Handle case where user doesn't exist
        if not user:
            print(f"⚠️ Warning: Servicer {servicer['_id']} has no associated user record")
            # Skip this servicer or create placeholder data
            continue
        
        # Convert ObjectIds to strings
        servicer_data = {
            '_id': str(servicer['_id']),
            'user_id': str(servicer['user_id']),
            'user_name': user.get('name', 'Unknown User'),
            'user_email': user.get('email', 'N/A'),
            'user_phone': user.get('phone', 'N/A'),
            'experience_years': servicer.get('experience_years', 0),
            'service_radius_km': servicer.get('service_radius_km', 10.0),
            'bio': servicer.get('bio', ''),
            'verification_status': servicer.get('verification_status'),
            'aadhaar_front_url': servicer.get('aadhaar_front_url', ''),
            'aadhaar_back_url': servicer.get('aadhaar_back_url', ''),
            'certificate_urls': servicer.get('certificate_urls', []),
            'vehicle_document_urls': servicer.get('vehicle_document_urls', []),
            'created_at': servicer.get('created_at'),
            'updated_at': servicer.get('updated_at')
        }
        
        result.append(servicer_data)
    
    return {"servicers": result}


# Also fix the get_verification_details endpoint:

@app.get("/api/admin/verifications/{servicer_id}")
async def get_verification_details(servicer_id: str, current_admin: dict = Depends(get_current_admin)):
    """View servicer documents"""
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
    
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer not found")
    
    # Get user details
    user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
    
    # ✅ FIXED: Handle case where user doesn't exist
    if not user:
        raise HTTPException(status_code=404, detail="User record not found for this servicer")
    
    # Convert ObjectIds to strings
    servicer_data = {
        '_id': str(servicer['_id']),
        'user_id': str(servicer['user_id']),
        'experience_years': servicer.get('experience_years', 0),
        'service_radius_km': servicer.get('service_radius_km', 10.0),
        'bio': servicer.get('bio', ''),
        'verification_status': servicer.get('verification_status'),
        'aadhaar_front_url': servicer.get('aadhaar_front_url', ''),
        'aadhaar_back_url': servicer.get('aadhaar_back_url', ''),
        'certificate_urls': servicer.get('certificate_urls', []),
        'vehicle_document_urls': servicer.get('vehicle_document_urls', []),
        'rejection_reason': servicer.get('rejection_reason', ''),
        'created_at': servicer.get('created_at'),
        'updated_at': servicer.get('updated_at'),
        'user_details': {
            'name': user.get('name', 'Unknown'),
            'email': user.get('email', 'N/A'),
            'phone': user.get('phone', 'N/A'),
            'address': f"{user.get('address_line1', '')} {user.get('address_line2', '')} {user.get('city', '')} {user.get('state', '')} {user.get('pincode', '')}".strip() or 'N/A'
        }
    }
    
    return servicer_data


# Also add a cleanup endpoint to find orphaned servicers:

@app.get("/api/admin/cleanup/orphaned-servicers")
async def find_orphaned_servicers(current_admin: dict = Depends(get_current_admin)):
    """Find servicers without user records (for debugging)"""
    all_servicers = await db[Collections.SERVICERS].find({}).to_list(1000)
    
    orphaned = []
    for servicer in all_servicers:
        user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
        if not user:
            orphaned.append({
                'servicer_id': str(servicer['_id']),
                'user_id': str(servicer['user_id']),
                'verification_status': servicer.get('verification_status'),
                'created_at': servicer.get('created_at')
            })
    
    return {
        'total_servicers': len(all_servicers),
        'orphaned_count': len(orphaned),
        'orphaned_servicers': orphaned
    }
@app.put("/api/admin/verifications/{servicer_id}/approve")
async def approve_servicer(servicer_id: str, current_admin: dict = Depends(get_current_admin)):
    """Approve servicer"""
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
    
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer not found")
    
    # Update servicer
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer_id)},
        {
            "$set": {
                "verification_status": VerificationStatus.APPROVED,
                "admin_verified_by": ObjectId(current_admin['_id']),
                "verified_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification to servicer
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.DOCUMENT_VERIFICATION,
        "Documents Approved",
        "Your documents have been verified. You can now start accepting bookings."
    )
    
    # Send email
    user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
    await send_email(
        user['email'],
        "Documents Approved",
        "<h2>Congratulations!</h2><p>Your documents have been approved. You can now start accepting service requests.</p>"
    )
    
    # Create audit log
    await db[Collections.AUDIT_LOGS].insert_one({
        "admin_id": ObjectId(current_admin['_id']),
        "action_type": "servicer_verified",
        "target_id": ObjectId(servicer_id),
        "target_type": "servicer",
        "details": {"servicer_name": user.get('name', '')},
        "created_at": datetime.utcnow()
    })
    
    # Emit socket event
    await sio.emit(
        SocketEvents.SERVICER_VERIFIED,
        {"servicer_id": servicer_id},
        room=f"user-{str(servicer['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.DOCUMENT_VERIFIED)

@app.put("/api/admin/verifications/{servicer_id}/reject")
async def reject_servicer(
    servicer_id: str,
    rejection_reason: str = Form(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Reject servicer with reason"""
    servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
    
    if not servicer:
        raise HTTPException(status_code=404, detail="Servicer not found")
    
    # Update servicer
    await db[Collections.SERVICERS].update_one(
        {"_id": ObjectId(servicer_id)},
        {
            "$set": {
                "verification_status": VerificationStatus.REJECTED,
                "rejection_reason": rejection_reason,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Send notification
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.DOCUMENT_VERIFICATION,
        "Documents Rejected",
        f"Your documents have been rejected. Reason: {rejection_reason}"
    )
    
    # Create audit log
    await db[Collections.AUDIT_LOGS].insert_one({
        "admin_id": ObjectId(current_admin['_id']),
        "action_type": "servicer_rejected",
        "target_id": ObjectId(servicer_id),
        "target_type": "servicer",
        "details": {"rejection_reason": rejection_reason},
        "created_at": datetime.utcnow()
    })
    
    return SuccessResponse(message=Messages.DOCUMENT_REJECTED)

@app.get("/api/admin/users")
async def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all users with filters"""
    query = {}
    
    if role:
        query["role"] = role
    if status == "active":
        query["is_blocked"] = False
    elif status == "blocked":
        query["is_blocked"] = True
    
    skip = (page - 1) * limit
    
    users = await db[Collections.USERS].find(query).skip(skip).limit(limit).to_list(limit)
    
    for user in users:
        user['_id'] = str(user['_id'])
        user.pop('password_hash', None)
    
    total = await db[Collections.USERS].count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }

@app.get("/api/admin/users/{user_id}")
async def get_user_details_admin(user_id: str, current_admin: dict = Depends(get_current_admin)):
    """Get detailed user profile and activity"""
    user = await db[Collections.USERS].find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user['_id'] = str(user['_id'])
    user.pop('password_hash', None)
    
    # Get bookings count
    bookings_count = await db[Collections.BOOKINGS].count_documents({"user_id": ObjectId(user_id)})
    
    # Get transactions
    transactions = await db[Collections.TRANSACTIONS].find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    for txn in transactions:
        txn['_id'] = str(txn['_id'])
        txn['user_id'] = str(txn['user_id'])
        if txn.get('booking_id'):
            txn['booking_id'] = str(txn['booking_id'])
    
    user['bookings_count'] = bookings_count
    user['recent_transactions'] = transactions
    
    return user

@app.put("/api/admin/users/{user_id}/block")
async def block_unblock_user(
    user_id: str,
    block: bool = Form(...),
    reason: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)
):
    """Block or unblock user"""
    result = await db[Collections.USERS].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_blocked": block, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send notification
    await create_notification(
        user_id,
        NotificationTypes.SYSTEM,
        "Account Status Changed",
        f"Your account has been {'blocked' if block else 'unblocked'}. {reason or ''}"
    )
    
    # Create audit log
    await db[Collections.AUDIT_LOGS].insert_one({
        "admin_id": ObjectId(current_admin['_id']),
        "action_type": "user_blocked" if block else "user_unblocked",
        "target_id": ObjectId(user_id),
        "target_type": "user",
        "details": {"reason": reason},
        "created_at": datetime.utcnow()
    })
    
    return SuccessResponse(message=f"User {'blocked' if block else 'unblocked'} successfully")

@app.get("/api/admin/bookings")
async def get_all_bookings_admin(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all bookings with filters"""
    query = {}
    
    if status:
        query["booking_status"] = status
    
    skip = (page - 1) * limit
    
    bookings = await db[Collections.BOOKINGS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # ✅ FIX: Convert all ObjectIds and datetimes first
    bookings = [convert_objectid_to_str(booking) for booking in bookings]
    
    # Then add user and servicer details
    for booking in bookings:
        # Get user details - ID is now a string after conversion
        user = await db[Collections.USERS].find_one({"_id": ObjectId(booking['user_id'])})
        if user:
            booking['user_name'] = user.get('name', '')
            booking['user_email'] = user.get('email', '')
        else:
            booking['user_name'] = 'Unknown'
            booking['user_email'] = ''
        
        # Get servicer details
        servicer_doc = await db[Collections.SERVICERS].find_one({"_id": ObjectId(booking['servicer_id'])})
        if servicer_doc:
            servicer_user = await db[Collections.USERS].find_one({"_id": servicer_doc['user_id']})
            if servicer_user:
                booking['servicer_name'] = servicer_user.get('name', '')
            else:
                booking['servicer_name'] = 'Unknown'
        else:
            booking['servicer_name'] = 'Unknown'
    
    total = await db[Collections.BOOKINGS].count_documents(query)
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }
@app.get("/api/admin/transactions")
async def get_all_transactions_admin(
    type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin: dict = Depends(get_current_admin)
):
    """Get all transactions with filters"""
    query = {}
    
    if type:
        query["transaction_type"] = type
    if status:
        query["transaction_status"] = status
    
    skip = (page - 1) * limit
    
    transactions = await db[Collections.TRANSACTIONS].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for txn in transactions:
        txn['_id'] = str(txn['_id'])
        txn['user_id'] = str(txn['user_id'])
        if txn.get('booking_id'):
            txn['booking_id'] = str(txn['booking_id'])
        if txn.get('servicer_id'):
            txn['servicer_id'] = str(txn['servicer_id'])
    
    total = await db[Collections.TRANSACTIONS].count_documents(query)
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }

@app.get("/api/admin/payouts")
async def get_payout_requests_admin(
    status: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get servicer payout requests"""
    query = {}
    
    if status:
        query["status"] = status
    else:
        query["status"] = "pending"
    
    payouts = await db[Collections.PAYOUT_REQUESTS].find(query).sort("created_at", -1).to_list(100)
    
    for payout in payouts:
        payout['_id'] = str(payout['_id'])
        payout['servicer_id'] = str(payout['servicer_id'])
        
        # Get servicer details
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(payout['servicer_id'])})
        if servicer:
            user = await db[Collections.USERS].find_one({"_id": servicer['user_id']})
            payout['servicer_name'] = user.get('name', '')
            payout['servicer_email'] = user.get('email', '')
            payout['servicer_phone'] = user.get('phone', '')
    
    return {"payouts": payouts}

@app.put("/api/admin/payouts/{payout_id}/approve")
async def approve_payout_admin(payout_id: str, current_admin: dict = Depends(get_current_admin)):
    """Approve and process payout"""
    payout = await db[Collections.PAYOUT_REQUESTS].find_one({"_id": ObjectId(payout_id)})
    
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    
    # Update payout request
    await db[Collections.PAYOUT_REQUESTS].update_one(
        {"_id": ObjectId(payout_id)},
        {
            "$set": {
                "status": "completed",
                "admin_processed_by": ObjectId(current_admin['_id']),
                "processed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create transaction record
    transaction = {
        "servicer_id": payout['servicer_id'],
        "user_id": payout['servicer_id'],
        "transaction_type": TransactionType.PAYOUT,
        "payment_method": PaymentMethod.STRIPE,
        "amount": payout['amount_requested'],
        "transaction_status": PaymentStatus.COMPLETED,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db[Collections.TRANSACTIONS].insert_one(transaction)
    
    # Send notification
    servicer = await db[Collections.SERVICERS].find_one({"_id": payout['servicer_id']})
    await create_notification(
        str(servicer['user_id']),
        NotificationTypes.PAYOUT,
        "Payout Processed",
        f"Your payout of ₹{payout['amount_requested']} has been processed"
    )
    
    # Create audit log
    await db[Collections.AUDIT_LOGS].insert_one({
        "admin_id": ObjectId(current_admin['_id']),
        "action_type": "payout_approved",
        "target_id": ObjectId(payout_id),
        "target_type": "payout",
        "details": {"amount": payout['amount_requested']},
        "created_at": datetime.utcnow()
    })
    
    # Emit socket event
    await sio.emit(
        SocketEvents.PAYOUT_PROCESSED,
        {"payout_id": payout_id},
        room=f"user-{str(servicer['user_id'])}"
    )
    
    return SuccessResponse(message=Messages.PAYOUT_APPROVED)

@app.get("/api/admin/categories")
async def get_service_categories_admin(current_admin: dict = Depends(get_current_admin)):
    """Get all service categories"""
    categories = await db[Collections.SERVICE_CATEGORIES].find({}).to_list(100)
    
    for cat in categories:
        cat['_id'] = str(cat['_id'])
        if cat.get('created_by'):
            cat['created_by'] = str(cat['created_by'])
    
    return {"categories": categories}

@app.post("/api/admin/categories")
async def create_service_category_admin(
    category_data: ServiceCategoryCreate,
    current_admin: dict = Depends(get_current_admin)
):
    """Create new service category"""
    category_dict = category_data.dict()
    category_dict['created_by'] = ObjectId(current_admin['_id'])
    category_dict['is_active'] = True
    category_dict['created_at'] = datetime.utcnow()
    category_dict['updated_at'] = datetime.utcnow()
    
    result = await db[Collections.SERVICE_CATEGORIES].insert_one(category_dict)
    
    # Create audit log
    await db[Collections.AUDIT_LOGS].insert_one({
        "admin_id": ObjectId(current_admin['_id']),
        "action_type": "category_created",
        "target_id": result.inserted_id,
        "target_type": "category",
        "details": {"name": category_data.name},
        "created_at": datetime.utcnow()
    })
    
    return SuccessResponse(
        message="Category created successfully",
        data={"category_id": str(result.inserted_id)}
    )

@app.get("/api/admin/audit-logs")
async def get_audit_logs_admin(
    page: int = 1,
    limit: int = 50,
    current_admin: dict = Depends(get_current_admin)
):
    """View all admin actions"""
    skip = (page - 1) * limit
    
    logs = await db[Collections.AUDIT_LOGS].find({}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for log in logs:
        log['_id'] = str(log['_id'])
        log['admin_id'] = str(log['admin_id'])
        if log.get('target_id'):
            log['target_id'] = str(log['target_id'])
        
        # Get admin name
        admin = await db[Collections.USERS].find_one({"_id": ObjectId(log['admin_id'])})
        log['admin_name'] = admin.get('name', '')
    
    total = await db[Collections.AUDIT_LOGS].count_documents({})
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit)
    }



# ============= ADD THIS TO YOUR main.py =============

# Enhanced seed endpoint with better error handling
@app.post("/api/admin/categories/seed", response_model=SuccessResponse)
async def seed_service_categories(current_admin: dict = Depends(get_current_admin)):
    """Seed initial service categories (Admin only) - Enhanced version"""
    
    default_categories = [
        {
            "name": "Plumbing",
            "description": "Pipe repairs, installations, leak fixing, and drainage solutions",
            "base_price": 500,
            "is_active": True,
            "icon": "droplet",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Electrical Work",
            "description": "Wiring, repairs, installations, and electrical maintenance",
            "base_price": 600,
            "is_active": True,
            "icon": "zap",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Carpentry",
            "description": "Furniture repair, custom woodwork, and installation services",
            "base_price": 700,
            "is_active": True,
            "icon": "briefcase",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Painting",
            "description": "Interior and exterior painting, wall treatments, and finishing",
            "base_price": 450,
            "is_active": True,
            "icon": "paintbrush",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Home Cleaning",
            "description": "Deep cleaning, regular maintenance, and sanitization services",
            "base_price": 400,
            "is_active": True,
            "icon": "home",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "AC Repair & Service",
            "description": "AC installation, maintenance, gas refilling, and repairs",
            "base_price": 550,
            "is_active": True,
            "icon": "wind",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Appliance Repair",
            "description": "Washing machine, refrigerator, and other appliance repairs",
            "base_price": 500,
            "is_active": True,
            "icon": "wrench",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Pest Control",
            "description": "Termite control, rodent removal, and general pest management",
            "base_price": 800,
            "is_active": True,
            "icon": "bug",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Gardening & Landscaping",
            "description": "Garden maintenance, landscaping, and plant care services",
            "base_price": 600,
            "is_active": True,
            "icon": "leaf",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Beauty & Salon Services",
            "description": "Haircut, styling, makeup, and beauty treatments at home",
            "base_price": 500,
            "is_active": True,
            "icon": "scissors",
            "popular": True,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Vehicle Washing & Detailing",
            "description": "Car wash, bike wash, and vehicle detailing services",
            "base_price": 350,
            "is_active": True,
            "icon": "droplet",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Laundry & Dry Cleaning",
            "description": "Washing, ironing, dry cleaning, and pickup/delivery",
            "base_price": 300,
            "is_active": True,
            "icon": "home",
            "popular": False,
            "created_by": ObjectId(current_admin['_id']),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Check if categories already exist
    existing_count = await db[Collections.SERVICE_CATEGORIES].count_documents({})
    
    if existing_count > 0:
        return SuccessResponse(
            message=f"{existing_count} categories already exist. Use the clear endpoint first if you want to reseed.",
            data={"existing_count": existing_count, "action": "skipped"}
        )
    
    # Insert all categories
    try:
        result = await db[Collections.SERVICE_CATEGORIES].insert_many(default_categories)
        inserted_count = len(result.inserted_ids)
        
        # Create audit log
        await db[Collections.AUDIT_LOGS].insert_one({
            "admin_id": ObjectId(current_admin['_id']),
            "action_type": "categories_seeded",
            "target_type": "category",
            "details": {"count": inserted_count},
            "created_at": datetime.utcnow()
        })
        
        # Get the inserted categories with IDs for response
        categories = await db[Collections.SERVICE_CATEGORIES].find({
            "_id": {"$in": result.inserted_ids}
        }).to_list(100)
        
        category_list = []
        for cat in categories:
            category_list.append({
                "id": str(cat['_id']),
                "name": cat['name'],
                "icon": cat.get('icon', 'briefcase'),
                "popular": cat.get('popular', False)
            })
        
        print(f"✅ Successfully seeded {inserted_count} categories")
        print(f"📋 Category IDs: {[str(id) for id in result.inserted_ids]}")
        
        return SuccessResponse(
            message=f"Successfully seeded {inserted_count} service categories",
            data={
                "inserted_count": inserted_count,
                "categories": category_list
            }
        )
    except Exception as e:
        print(f"❌ Error seeding categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to seed categories: {str(e)}")


# Optional: Clear categories endpoint (for testing)
@app.delete("/api/admin/categories/clear", response_model=SuccessResponse)
async def clear_all_categories(current_admin: dict = Depends(get_current_admin)):
    """Clear all service categories (Admin only) - Use with caution!"""
    
    try:
        # Count existing
        count = await db[Collections.SERVICE_CATEGORIES].count_documents({})
        
        if count == 0:
            return SuccessResponse(
                message="No categories to clear",
                data={"deleted_count": 0}
            )
        
        # Delete all
        result = await db[Collections.SERVICE_CATEGORIES].delete_many({})
        
        # Create audit log
        await db[Collections.AUDIT_LOGS].insert_one({
            "admin_id": ObjectId(current_admin['_id']),
            "action_type": "categories_cleared",
            "target_type": "category",
            "details": {"count": result.deleted_count},
            "created_at": datetime.utcnow()
        })
        
        print(f"🗑️ Cleared {result.deleted_count} categories")
        
        return SuccessResponse(
            message=f"Cleared {result.deleted_count} categories",
            data={"deleted_count": result.deleted_count}
        )
    except Exception as e:
        print(f"❌ Error clearing categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear categories: {str(e)}")


# Enhanced public categories endpoint
@app.get("/api/public/categories")
async def get_public_categories():
    """Get all active service categories (no authentication required)"""
    try:
        categories = await db[Collections.SERVICE_CATEGORIES].find({
            "is_active": True
        }).to_list(100)
        
        result = []
        for cat in categories:
            cat_dict = {
                "_id": str(cat['_id']),
                "name": cat['name'],
                "description": cat.get('description', ''),
                "base_price": cat.get('base_price', 0),
                "icon": cat.get('icon', 'briefcase'),
                "popular": cat.get('popular', False),
                "is_active": cat.get('is_active', True)
            }
            
            # Count servicers offering this category
            servicers_count = await db[Collections.SERVICERS].count_documents({
                "service_categories": cat['_id'],
                "verification_status": VerificationStatus.APPROVED
            })
            cat_dict['servicers_count'] = servicers_count
            
            result.append(cat_dict)
        
        print(f"📦 Returning {len(result)} public categories")
        return {
            "categories": result,
            "total": len(result)
        }
    except Exception as e:
        print(f"❌ Error fetching public categories: {e}")
        # Return empty list instead of error for better UX
        return {
            "categories": [],
            "total": 0,
            "error": str(e)
        }


# Debug endpoint to check servicer categories
@app.get("/api/admin/servicers/{servicer_id}/categories")
async def get_servicer_categories_debug(
    servicer_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Debug endpoint to check servicer's categories"""
    try:
        servicer = await db[Collections.SERVICERS].find_one({"_id": ObjectId(servicer_id)})
        
        if not servicer:
            raise HTTPException(status_code=404, detail="Servicer not found")
        
        # Get category details
        category_ids = servicer.get('service_categories', [])
        categories = []
        
        for cat_id in category_ids:
            cat = await db[Collections.SERVICE_CATEGORIES].find_one({"_id": cat_id})
            if cat:
                categories.append({
                    "id": str(cat['_id']),
                    "name": cat['name'],
                    "description": cat.get('description', '')
                })
            else:
                categories.append({
                    "id": str(cat_id),
                    "name": "INVALID - Category not found",
                    "description": "This category ID doesn't exist in database"
                })
        
        return {
            "servicer_id": servicer_id,
            "category_ids": [str(id) for id in category_ids],
            "categories": categories,
            "total_categories": len(category_ids),
            "valid_categories": len([c for c in categories if "INVALID" not in c['name']])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ============= FILE UPLOAD ENDPOINTS =============

@app.post("/api/upload/profile")
async def upload_profile_image_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile photo - images only"""
    result = await upload_to_cloudinary(
        file, 
        CloudinaryFolders.PROFILES,
        allowed_types=['image/*']  # Only images
    )
    return {"url": result['url'], "public_id": result['public_id']}
# ============= STRIPE WEBHOOK =============
@app.post("/api/webhooks/stripe")
async def stripe_webhook_handler(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle payment intent succeeded
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Update transaction
        await db[Collections.TRANSACTIONS].update_one(
            {"stripe_payment_intent_id": payment_intent['id']},
            {"$set": {"transaction_status": PaymentStatus.COMPLETED}}
        )
        
        # If wallet topup
        if payment_intent['metadata'].get('purpose') == 'wallet_topup':
            user_id = payment_intent['metadata'].get('user_id')
            amount = payment_intent['amount'] / 100
            
            await db[Collections.WALLETS].update_one(
                {"user_id": ObjectId(user_id)},
                {
                    "$inc": {"balance": amount},
                    "$set": {"last_transaction_at": datetime.utcnow()}
                }
            )
            
            await create_notification(
                user_id,
                NotificationTypes.PAYMENT,
                "Wallet Topped Up",
                f"₹{amount} added to your wallet"
            )
        
        # If booking payment
        elif payment_intent['metadata'].get('booking_id'):
            booking_id = payment_intent['metadata'].get('booking_id')
            
            await db[Collections.BOOKINGS].update_one(
                {"_id": ObjectId(booking_id)},
                {"$set": {"payment_status": PaymentStatus.COMPLETED}}
            )
            
            booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
            
            await create_notification(
                str(booking['user_id']),
                NotificationTypes.PAYMENT,
                "Payment Successful",
                f"Payment completed for booking #{booking['booking_number']}"
            )
            
            # Emit socket event
            await sio.emit(
                SocketEvents.PAYMENT_COMPLETED,
                {"booking_id": booking_id},
                room=f"user-{str(booking['user_id'])}"
            )
    
    return {"status": "success"}

# ============= SOCKET.IO EVENTS =============
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")

@sio.event
async def authenticate(sid, data):
    """Authenticate socket connection"""
    try:
        token = data.get('token')
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        # Join user-specific room
        await sio.enter_room(sid, f"user-{user_id}")
        
        # If admin, join admin room
        user = await db[Collections.USERS].find_one({"_id": ObjectId(user_id)})
        if user and user['role'] == UserRole.ADMIN:
            await sio.enter_room(sid, "admins")
        
        await sio.emit('authenticated', {'user_id': user_id}, room=sid)
    except Exception as e:
        await sio.emit('auth_error', {'message': str(e)}, room=sid)

@sio.event
async def send_message(sid, data):
    """Handle chat message"""
    booking_id = data.get('booking_id')
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    message_text = data.get('message_text')
    
    # Save to database
    message = {
        "booking_id": ObjectId(booking_id),
        "sender_id": ObjectId(sender_id),
        "receiver_id": ObjectId(receiver_id),
        "message_type": MessageType.TEXT,
        "message_text": message_text,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "is_read": False
    }
    
    result = await db[Collections.CHAT_MESSAGES].insert_one(message)
    message['_id'] = str(result.inserted_id)
    message['booking_id'] = str(message['booking_id'])
    message['sender_id'] = str(message['sender_id'])
    message['receiver_id'] = str(message['receiver_id'])
    
    # Emit to receiver
    await sio.emit('receive_message', message, room=f"user-{receiver_id}")

@sio.event
async def typing(sid, data):
    """Handle typing indicator"""
    receiver_id = data.get('receiver_id')
    sender_id = data.get('sender_id')
    
    await sio.emit('typing', {'sender_id': sender_id}, room=f"user-{receiver_id}")

@sio.event
async def location_update(sid, data):
    """Handle location update from servicer"""
    booking_id = data.get('booking_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    # Save to database
    tracking = {
        "booking_id": ObjectId(booking_id),
        "servicer_latitude": latitude,
        "servicer_longitude": longitude,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    await db[Collections.BOOKING_TRACKING].insert_one(tracking)
    
    # Get booking and emit to user
    booking = await db[Collections.BOOKINGS].find_one({"_id": ObjectId(booking_id)})
    if booking:
        await sio.emit(
            SocketEvents.LOCATION_UPDATE,
            tracking,
            room=f"user-{str(booking['user_id'])}"
        )

# ============= ROOT ENDPOINT =============
@app.get("/")
async def root():
    """API Root"""
    return {
        "message": "Service Provider Platform API",
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        await db.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )

# ============= RUN APPLICATION =============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        socket_app,
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )