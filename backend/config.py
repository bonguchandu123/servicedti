import os
from pydantic_settings import BaseSettings
from typing import Optional,ClassVar


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Service Provider Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str = "service_provider_platform"
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    COMPLETION_OTP_LENGTH: int = 6
    COMPLETION_OTP_EXPIRY_HOURS: int = 24
    MAX_OTP_VERIFICATION_ATTEMPTS: int = 5
    OTP_VERIFICATION_LOCKOUT_MINUTES: int = 30
    
    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_CURRENCY: str = "inr"
    
    # SMTP / Email
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str = "Service Provider Platform"
    
    # Platform Fees & Configuration
    PLATFORM_FEE_PERCENTAGE: float = 15.0  # 15% platform fee
    MIN_PAYOUT_AMOUNT: float = 500.0
    MAX_SERVICE_RADIUS_KM: float = 50.0
    OTP_EXPIRY_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3
    
    # File Upload Limits (in MB)
    MAX_PROFILE_IMAGE_SIZE: int = 5
    MAX_DOCUMENT_SIZE: int = 10
    MAX_CHAT_FILE_SIZE: int = 20
    USER_ADDRESSES: ClassVar[str] = "user_addresses"
    USER_SETTINGS: ClassVar[str] = "user_settings"
    USER_WISHLIST: ClassVar[str] = "user_wishlist"
    RACKING_STARTED: ClassVar[str] = "tracking_started"
    SERVICER_ARRIVED: ClassVar[str] = "servicer_arrived"
    ROUTE_UPDATE: ClassVar[str] = "route_update"
    ETA_UPDATE: ClassVar[str] = "eta_update"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]
    
    # WebSocket
    SOCKET_IO_CORS_ALLOWED_ORIGINS: str = "*"
    
    # Frontend URL (for email links)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # OpenStreetMap / Nominatim (for geocoding)
    NOMINATIM_USER_AGENT: str = "service_provider_platform/1.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


# MongoDB Collections Names
class Collections:
    USERS = "users"
    OTPS = "otps"
    SERVICERS = "servicers"
    SERVICER_AVAILABILITY = "servicer_availability"
    SERVICE_CATEGORIES = "service_categories"
    SERVICER_PRICING = "servicer_pricing"
    BOOKINGS = "bookings"
    BOOKING_TRACKING = "booking_tracking"
    TRANSACTIONS = "transactions"
    WALLETS = "wallets"
    PAYOUT_REQUESTS = "payout_requests"
    RATINGS = "ratings"
    CHAT_MESSAGES = "chat_messages"
    NOTIFICATIONS = "notifications"
    FAVORITE_SERVICERS = "favorite_servicers"
    SUPPORT_TICKETS = "support_tickets"
    TICKET_REPLIES = "ticket_replies"
    PROMO_CODES = "promo_codes"
    PROMO_USAGE = "promo_usage"
    REFERRALS = "referrals"
    PLATFORM_ANALYTICS = "platform_analytics"
    AUDIT_LOGS = "audit_logs"
    # NEW COLLECTIONS FOR USER FEATURES
    PROBLEM_DIAGNOSIS = "problem_diagnosis"
    BOOKING_ISSUES = "booking_issues"
    MAINTENANCE_REMINDERS = "maintenance_reminders"
    QUALITY_CLAIMS = "quality_claims"
    WORK_PROGRESS_UPDATES = "work_progress_updates"
    SERVICE_AREA_COVERAGE = "service_area_coverage"
    SERVICE_BUNDLES = "service_bundles"
    SERVICE_ESTIMATES = "service_estimates"
    INSTANT_AVAILABILITY = "instant_availability"


# Cloudinary Folders
class CloudinaryFolders:
    PROFILES = "service-platform/profiles"
    AADHAAR = "service-platform/documents/aadhaar"
    CERTIFICATES = "service-platform/documents/certificates"
    VEHICLES = "service-platform/documents/vehicles"
    PORTFOLIO = "service-platform/portfolio"
    CHAT_IMAGES = "service-platform/chat/images"
    CHAT_FILES = "service-platform/chat/files"
    PAYMENT_PROOFS = "service-platform/payments"
    SUPPORT = "service-platform/support"
    REVIEWS = "service-platform/reviews"
    CATEGORY_ICONS = "service-platform/category-icons"
     # NEW FOLDERS
    PROBLEM_DIAGNOSIS = "service-platform/problem-diagnosis"
    ISSUE_EVIDENCE = "service-platform/issue-evidence"
    WORK_PROGRESS = "service-platform/work-progress"


# Email Templates
class EmailTemplates:
    WELCOME = "welcome"
    OTP_VERIFICATION = "otp_verification"
    EMAIL_VERIFIED = "email_verified"
    DOCUMENT_SUBMITTED = "document_submitted"
    DOCUMENT_APPROVED = "document_approved"
    DOCUMENT_REJECTED = "document_rejected"
    NEW_BOOKING = "new_booking"
    BOOKING_ACCEPTED = "booking_accepted"
    BOOKING_CANCELLED = "booking_cancelled"
    SERVICE_STARTED = "service_started"
    SERVICE_COMPLETED = "service_completed"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"
    REFUND_PROCESSED = "refund_processed"
    PAYOUT_APPROVED = "payout_approved"
    RATING_RECEIVED = "rating_received"
    SUPPORT_TICKET_CREATED = "support_ticket_created"
    TICKET_RESOLVED = "ticket_resolved"
    PASSWORD_CHANGED = "password_changed"
    ACCOUNT_BLOCKED = "account_blocked"


# Notification Types
class NotificationTypes:
    BOOKING_UPDATE = "booking_update"
    PAYMENT = "payment"
    RATING = "rating"
    MESSAGE = "message"
    PROMOTION = "promotion"
    DOCUMENT_VERIFICATION = "document_verification"
    PAYOUT = "payout"
    SYSTEM = "system"
    OTP_GENERATED = "otp_generated"
    OTP_REQUESTED = "otp_requested"
    SERVICE_COMPLETION = "service_completion"


# WebSocket Events
class SocketEvents:
    # Connection
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    AUTHENTICATE = "authenticate"
    
    # Tracking
    LOCATION_UPDATE = "location_update"
    ETA_UPDATE = "eta_update"
    ROUTE_UPDATE = "route_update"
    SERVICE_STARTED = "service_started"
    SERVICE_COMPLETED = "service_completed"
    
    # Chat
    SEND_MESSAGE = "send_message"
    RECEIVE_MESSAGE = "receive_message"
    TYPING = "typing"
    STOP_TYPING = "stop_typing"
    MESSAGE_READ = "message_read"
    SEND_IMAGE = "send_image"
    SEND_FILE = "send_file"
    SEND_LOCATION = "send_location"
    DELETE_MESSAGE = "delete_message"
    
    # Booking
    NEW_BOOKING_REQUEST = "new_booking_request"
    BOOKING_ACCEPTED = "booking_accepted"
    BOOKING_REJECTED = "booking_rejected"
    BOOKING_CANCELLED = "booking_cancelled"
    PAYMENT_COMPLETED = "payment_completed"
    PAYMENT_FAILED = "payment_failed"
    CASH_PAYMENT_CONFIRMED = "cash_payment_confirmed"
    
    # Notifications
    NEW_NOTIFICATION = "new_notification"
    NOTIFICATION_READ = "notification_read"
    BADGE_COUNT_UPDATE = "badge_count_update"
    
    # Rating
    NEW_RATING = "new_rating"
    RATING_RESPONSE = "rating_response"
    
    # Admin
    SERVICER_VERIFIED = "servicer_verified"
    SERVICER_REJECTED = "servicer_rejected"
    PAYOUT_PROCESSED = "payout_processed"
    ANNOUNCEMENT = "announcement"
    USER_BLOCKED = "user_blocked"
    
    # Presence
    USER_ONLINE = "user_online"
    USER_OFFLINE = "user_offline"
    SERVICER_STATUS_CHANGE = "servicer_status_change"

    # otp events
    OTP_GENERATED = "otp_generated"
    OTP_REQUESTED = "otp_requested"
    OTP_VERIFIED = "otp_verified"
    OTP_VERIFICATION_FAILED = "otp_verification_failed"
    COMPLETION_REQUESTED = "completion_requested"


# Allowed File Extensions
class AllowedExtensions:
    IMAGES = ["jpg", "jpeg", "png", "webp", "gif"]
    DOCUMENTS = ["pdf", "doc", "docx"]
    EXCEL = ["xls", "xlsx"]
    CHAT_FILES = ["pdf", "doc", "docx", "xls", "xlsx", "txt"]
    ALL_FILES = IMAGES + DOCUMENTS + EXCEL + CHAT_FILES


# HTTP Status Messages
class Messages:
    # Success Messages
    SUCCESS = "Operation completed successfully"
    CREATED = "Resource created successfully"
    UPDATED = "Resource updated successfully"
    DELETED = "Resource deleted successfully"
    
    # Auth Messages
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logout successful"
    SIGNUP_SUCCESS = "Registration successful"
    OTP_SENT = "OTP sent successfully"
    OTP_VERIFIED = "OTP verified successfully"
    PASSWORD_CHANGED = "Password changed successfully"
    PASSWORD_RESET = "Password reset successfully"
    
    # Error Messages
    UNAUTHORIZED = "Unauthorized access"
    FORBIDDEN = "Access forbidden"
    NOT_FOUND = "Resource not found"
    BAD_REQUEST = "Bad request"
    INTERNAL_ERROR = "Internal server error"
    INVALID_CREDENTIALS = "Invalid credentials"
    EMAIL_EXISTS = "Email already exists"
    INVALID_OTP = "Invalid or expired OTP"
    OTP_EXPIRED = "OTP has expired"
    MAX_OTP_ATTEMPTS = "Maximum OTP attempts reached"
    ACCOUNT_BLOCKED = "Your account has been blocked"
    EMAIL_NOT_VERIFIED = "Email not verified"
    
    # Booking Messages
    BOOKING_CREATED = "Booking created successfully"
    BOOKING_ACCEPTED = "Booking accepted successfully"
    BOOKING_REJECTED = "Booking rejected successfully"
    BOOKING_CANCELLED = "Booking cancelled successfully"
    BOOKING_COMPLETED = "Booking completed successfully"
    BOOKING_NOT_FOUND = "Booking not found"
    CANNOT_CANCEL_BOOKING = "Cannot cancel booking at this stage"
    
    # Payment Messages
    PAYMENT_SUCCESS = "Payment completed successfully"
    PAYMENT_FAILED = "Payment failed"
    REFUND_PROCESSED = "Refund processed successfully"
    INSUFFICIENT_BALANCE = "Insufficient wallet balance"
    PAYOUT_REQUESTED = "Payout request submitted successfully"
    PAYOUT_APPROVED = "Payout approved successfully"
    MIN_PAYOUT_NOT_MET = "Minimum payout amount not met"
    
    # Document Messages
    DOCUMENT_UPLOADED = "Document uploaded successfully"
    DOCUMENT_VERIFIED = "Documents verified successfully"
    DOCUMENT_REJECTED = "Documents rejected"
    
    # Rating Messages
    RATING_SUBMITTED = "Rating submitted successfully"
    RATING_EXISTS = "Rating already exists for this booking"
    
    # File Upload Messages
    FILE_TOO_LARGE = "File size exceeds limit"
    INVALID_FILE_TYPE = "Invalid file type"
    UPLOAD_FAILED = "File upload failed"

    # NEW MESSAGES
    ISSUE_REPORTED = "Issue reported successfully"
    QUALITY_CLAIM_SUBMITTED = "Quality guarantee claim submitted"
    MAINTENANCE_REMINDER_SET = "Maintenance reminder set successfully"
    BUNDLE_BOOKING_CREATED = "Bundle booking created successfully"
    NO_SERVICERS_AVAILABLE = "No servicers available in your area"
    SERVICE_ESTIMATE_GENERATED = "Service cost estimate generated"
    # otp messages
    OTP_GENERATED = "Completion OTP generated and sent"
    OTP_RESENT = "OTP sent to your notifications"
    OTP_INVALID = "Invalid OTP. Please check with servicer and try again."
    OTP_EXPIRED = "OTP has expired. Please contact support."
    OTP_NOT_FOUND = "No completion OTP found. Please ask servicer to start the service first."
    OTP_MAX_ATTEMPTS_REACHED = "Maximum OTP verification attempts reached. Please contact support."
    SERVICE_COMPLETED_SUCCESS = "Service completed successfully! Thank you for using our service."
    OTP_REQUEST_SENT = "Reminder sent to servicer. They will share the OTP with you shortly."


# Rate Limiting
class RateLimits:
    OTP_RESEND_COOLDOWN_SECONDS = 60  # 1 minute
    PASSWORD_RESET_COOLDOWN_MINUTES = 15
    MAX_LOGIN_ATTEMPTS = 5
    LOGIN_LOCKOUT_MINUTES = 30