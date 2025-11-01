from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from bson import ObjectId
from enum import Enum

# Custom ObjectId type for Pydantic v2
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        
        def validate(value: Any) -> str:
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return value
                raise ValueError("Invalid ObjectId")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            )
        )


# Enums
class UserRole(str, Enum):
    USER = "user"
    SERVICER = "servicer"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESUBMIT = "resubmit"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"      # ✅ add this
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    CANCEL_REQUESTED = "cancel_requested"
    
    

class PaymentMethod(str, Enum):
    CASH = "cash"
    STRIPE = "stripe"
    WALLET = "wallet"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


class TransactionType(str, Enum):
    BOOKING_PAYMENT = "booking_payment"
    REFUND = "refund"
    PAYOUT = "payout"
    WALLET_TOPUP = "wallet_topup"


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    LOCATION = "location"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ============= USER MODELS =============
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    role: UserRole = UserRole.USER

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    service_categories: Optional[List[str]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    full_name: Optional[str] = None
    password_hash: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = "India"
    email_verified: bool = False
    otp_verified: bool = False
    profile_image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    is_blocked: bool = False
    fcm_token: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class ProblemDiagnosis(BaseModel):
    """Model for AI-assisted problem diagnosis"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    category_id: PyObjectId
    problem_description: str
    problem_images: List[str] = []
    urgency: str  # normal, urgent, emergency
    status: str = "pending"
    diagnosis_result: Optional[dict] = None
    recommended_servicers: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class BookingIssue(BaseModel):
    """Model for reporting booking issues"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    user_id: PyObjectId
    servicer_id: PyObjectId
    issue_type: str  # late_arrival, poor_quality, incomplete_work, unprofessional, safety_concern
    description: str
    evidence_urls: List[str] = []
    resolution_expected: str  # refund, redo, discount, apology
    status: str = "pending_review"  # pending_review, investigating, resolved, rejected
    priority: str = "medium"  # low, medium, high, urgent
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class MaintenanceReminder(BaseModel):
    """Model for recurring service reminders"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    category_id: PyObjectId
    service_name: str
    frequency: str  # weekly, monthly, quarterly, yearly
    preferred_servicer_id: Optional[PyObjectId] = None
    next_service_date: datetime
    last_service_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool = True
    reminders_sent: int = 0
    services_completed: int = 0
    auto_book: bool = False  # Auto-book when reminder triggers
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class QualityClaim(BaseModel):
    """Model for quality guarantee claims"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    user_id: PyObjectId
    servicer_id: PyObjectId
    issue_description: str
    claim_type: str = "quality_guarantee"
    evidence_urls: List[str] = []
    status: str = "pending_review"  # pending_review, approved, rejected, resolved
    resolution: Optional[str] = None  # redo_same_servicer, redo_different_servicer, partial_refund, full_refund
    resolution_amount: Optional[float] = None
    redo_booking_id: Optional[PyObjectId] = None
    admin_notes: Optional[str] = None
    servicer_response: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class WorkProgressUpdate(BaseModel):
    """Model for servicer's work progress updates"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    servicer_id: PyObjectId
    status: str  # started, in_progress, materials_needed, nearly_complete, complete
    description: Optional[str] = None
    images: List[str] = []
    progress_percentage: int = 0  # 0-100
    estimated_completion: Optional[datetime] = None
    materials_list: Optional[List[dict]] = None  # [{"item": "...", "cost": ...}]
    notes_for_user: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class ServiceAreaCoverage(BaseModel):
    """Model for checking service availability in area"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    location: dict  # {address, latitude, longitude, city, state}
    available_categories: List[str] = []
    unavailable_categories: List[str] = []
    nearest_servicers: dict = {}  # {"category_id": [servicer_ids]}
    coverage_radius_km: float = 10.0
    last_checked: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class ServiceBundle(BaseModel):
    """Model for bundled service bookings"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    bundle_name: str
    booking_ids: List[PyObjectId] = []
    category_ids: List[PyObjectId] = []
    booking_date: str
    booking_time: str
    service_location: dict
    total_amount: float
    bundle_discount: float = 0.0
    final_amount: float
    payment_method: str
    payment_status: str = "pending"
    bundle_status: str = "pending"  # pending, in_progress, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class ServiceEstimate(BaseModel):
    """Model for service cost estimates"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: Optional[PyObjectId] = None
    category_id: PyObjectId
    service_type: str  # one_time, recurring, subscription
    estimated_hours: Optional[float] = None
    materials_needed: bool = False
    recurring_frequency: Optional[str] = None
    base_cost: float
    materials_cost: float = 0.0
    recurring_discount: float = 0.0
    subtotal: float
    platform_fee: float
    total_estimate: float
    market_average: Optional[float] = None
    valid_until: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class InstantAvailability(BaseModel):
    """Model for instant servicer availability check"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    category_id: PyObjectId
    location: dict  # {latitude, longitude}
    urgency: str  # normal, urgent, emergency
    available_servicers: List[dict] = []
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    valid_for_minutes: int = 30

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

# ============= OTP MODELS =============
class OTPCreate(BaseModel):
    email: EmailStr
    purpose: str  # email_verification, password_reset


class OTP(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    otp_code: str
    purpose: str
    expires_at: datetime
    verified: bool = False
    attempts: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= SERVICER MODELS =============
class ServicerCreate(BaseModel):
    service_categories: List[str]
    experience_years: int
    bio: Optional[str] = None
    has_vehicle: bool = False
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None


class Servicer(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    service_categories: List[str] = []
    experience_years: int = 0
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None
    aadhaar_front_url: Optional[str] = None
    aadhaar_back_url: Optional[str] = None
    certificate_urls: List[str] = []
    vehicle_document_urls: List[str] = []
    has_vehicle: bool = False
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.PENDING
    rejection_reason: Optional[str] = None
    admin_verified_by: Optional[PyObjectId] = None
    verified_at: Optional[datetime] = None
    average_rating: float = 0.0
    total_ratings: int = 0
    total_jobs_completed: int = 0
    service_radius_km: float = 10.0
    working_hours: Optional[dict] = None
    availability_status: AvailabilityStatus = AvailabilityStatus.OFFLINE
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    portfolio_images: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= SERVICE CATEGORY MODELS =============
class ServiceCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: float
    icon_url: Optional[str] = None


class ServiceCategory(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    base_price: float
    is_active: bool = True
    created_by: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= SERVICER PRICING MODELS =============
class ServicerPricingCreate(BaseModel):
    category_id: str
    price_per_hour: Optional[float] = None
    fixed_price: Optional[float] = None
    additional_charges: Optional[dict] = None


class ServicerPricing(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    servicer_id: PyObjectId
    category_id: PyObjectId
    price_per_hour: Optional[float] = None
    fixed_price: Optional[float] = None
    additional_charges: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= BOOKING MODELS =============
class BookingCreate(BaseModel):
    servicer_id: str
    service_category_id: str
    booking_date: str
    booking_time: str
    service_location: dict  # {address, latitude, longitude}
    problem_description: str
    urgency_level: UrgencyLevel = UrgencyLevel.MEDIUM
    payment_method: PaymentMethod


class Booking(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_number: str
    user_id: PyObjectId
    servicer_id: PyObjectId
    service_category_id: PyObjectId
    service_type: Optional[str] = None
    booking_date: str
    booking_time: str
    service_location: dict
    problem_description: str
    urgency_level: UrgencyLevel = UrgencyLevel.MEDIUM
    estimated_duration: Optional[int] = None
    payment_method: PaymentMethod
    payment_status: PaymentStatus = PaymentStatus.PENDING
    booking_status: BookingStatus = BookingStatus.PENDING
    total_amount: float = 0.0
    platform_fee: float = 0.0
    servicer_amount: float = 0.0
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[PyObjectId] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_otp: Optional[str] = Field(None, description="6-digit OTP for service completion")
    completion_otp_expires_at: Optional[datetime] = Field(None, description="OTP expiration time")
    otp_verified: bool = Field(False, description="Whether OTP has been verified")
    otp_verified_at: Optional[datetime] = Field(None, description="When OTP was verified")
    otp_failed_attempts: int = Field(0, description="Number of failed OTP attempts")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= BOOKING TRACKING MODELS =============
class BookingTracking(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    servicer_latitude: float
    servicer_longitude: float
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    distance_remaining_km: Optional[float] = None
    eta_minutes: Optional[int] = None
    route_polyline: List[List[float]] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= TRANSACTION MODELS =============
class Transaction(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: Optional[PyObjectId] = None
    user_id: PyObjectId
    servicer_id: Optional[PyObjectId] = None
    transaction_type: TransactionType
    payment_method: PaymentMethod
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    amount: float
    platform_fee: float = 0.0
    servicer_earnings: float = 0.0
    transaction_status: PaymentStatus = PaymentStatus.PENDING
    payment_proof_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= WALLET MODELS =============
class Wallet(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    balance: float = 0.0
    total_earned: float = 0.0
    total_spent: float = 0.0
    currency: str = "INR"
    last_transaction_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= PAYOUT REQUEST MODELS =============
class PayoutRequestCreate(BaseModel):
    amount_requested: float
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None


class PayoutRequest(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    servicer_id: PyObjectId
    amount_requested: float
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    status: str = "pending"
    admin_processed_by: Optional[PyObjectId] = None
    processed_at: Optional[datetime] = None
    transaction_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= RATING MODELS =============
class RatingCreate(BaseModel):
    booking_id: str
    overall_rating: int = Field(ge=1, le=5)
    punctuality_score: int = Field(ge=1, le=5)
    professionalism_score: int = Field(ge=1, le=5)
    quality_score: int = Field(ge=1, le=5)
    review_text: Optional[str] = None


class Rating(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    user_id: PyObjectId
    servicer_id: PyObjectId
    overall_rating: int
    punctuality_score: int
    professionalism_score: int
    quality_score: int
    review_text: Optional[str] = None
    review_images_urls: List[str] = []
    response_from_servicer: Optional[str] = None
    response_at: Optional[datetime] = None
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= CHAT MESSAGE MODELS =============
class ChatMessageCreate(BaseModel):
    booking_id: str
    receiver_id: str
    message_type: MessageType = MessageType.TEXT
    message_text: Optional[str] = None
    file_url: Optional[str] = None


class ChatMessage(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    booking_id: PyObjectId
    sender_id: PyObjectId
    receiver_id: PyObjectId
    message_type: MessageType
    message_text: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    deleted_by: List[PyObjectId] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= NOTIFICATION MODELS =============
class Notification(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    notification_type: str
    title: str
    message: str
    action_url: Optional[str] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= FAVORITE SERVICERS MODELS =============
class FavoriteServicer(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    servicer_id: PyObjectId
    added_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= SUPPORT TICKET MODELS =============
class SupportTicketCreate(BaseModel):
    booking_id: Optional[str] = None
    category: str
    priority: TicketPriority = TicketPriority.MEDIUM
    subject: str
    description: str


class SupportTicket(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    ticket_number: str
    user_id: PyObjectId
    booking_id: Optional[PyObjectId] = None
    category: str
    priority: TicketPriority
    subject: str
    description: str
    attachments_urls: List[str] = []
    status: TicketStatus = TicketStatus.OPEN
    assigned_to: Optional[PyObjectId] = None
    resolution_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= TICKET REPLY MODELS =============
class TicketReplyCreate(BaseModel):
    message: str
    attachments_urls: List[str] = []


class TicketReply(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    ticket_id: PyObjectId
    user_id: PyObjectId
    message: str
    attachments_urls: List[str] = []
    is_admin_reply: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= PROMO CODE MODELS =============
class PromoCodeCreate(BaseModel):
    code: str
    discount_type: str  # percentage, fixed
    discount_value: float
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0.0
    valid_from: datetime
    valid_until: datetime
    usage_limit: int
    applicable_categories: List[str] = []


class PromoCode(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    code: str
    discount_type: str
    discount_value: float
    max_discount_amount: Optional[float] = None
    min_order_amount: float
    valid_from: datetime
    valid_until: datetime
    usage_limit: int
    used_count: int = 0
    applicable_categories: List[str] = []
    is_active: bool = True
    created_by: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============= AUDIT LOG MODELS =============
class AuditLog(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    admin_id: PyObjectId
    action_type: str
    target_id: Optional[PyObjectId] = None
    target_type: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class TransactionIssue(BaseModel):
    """Model for transaction-related issues"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    transaction_id: Optional[PyObjectId] = None
    booking_id: Optional[PyObjectId] = None
    user_id: PyObjectId
    issue_type: str  # payment_failed, payment_pending, refund_request, duplicate_charge, payment_not_received, incorrect_amount
    description: str
    amount: float
    evidence_urls: List[str] = []
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending_review"  # pending_review, investigating, resolved, rejected
    resolution: Optional[str] = None
    refund_amount: Optional[float] = None
    admin_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
# ============= OTP COMPLETION MODELS =============
class OTPVerificationRequest(BaseModel):
    """Request model for OTP verification"""
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    
    @field_validator('otp')
    def validate_otp_format(cls, v):
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        return v


class CompletionOTPResponse(BaseModel):
    """Response model for OTP retrieval"""
    otp: str
    status: str  # "active" or "expired"
    booking_number: str
    expires_at: Optional[str] = None
    message: str


class ServiceCompletionResponse(BaseModel):
    """Response after successful OTP verification"""
    booking_id: str
    booking_number: str
    completed_at: str
    servicer_name: str
    verified: bool = True

# ============= RESPONSE MODELS =============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None


# Complaint Models
class ComplaintCreate(BaseModel):
    complaint_against_id: str  # User/Servicer being complained about
    complaint_against_type: str  # "user" or "servicer"
    booking_id: Optional[str] = None
    complaint_type: str  # See ComplaintType enum below
    subject: str
    description: str
    severity: str = "medium"  # low, medium, high, critical
    refund_requested: bool = False
    refund_amount: Optional[float] = None

class ComplaintType:
    NO_SHOW = "no_show"
    POOR_QUALITY = "poor_quality"
    RUDE_BEHAVIOR = "rude_behavior"
    OVERCHARGING = "overcharging"
    DAMAGE_PROPERTY = "damage_property"
    SAFETY_CONCERN = "safety_concern"
    FRAUD = "fraud"
    LATE_ARRIVAL = "late_arrival"
    INCOMPLETE_WORK = "incomplete_work"
    PAYMENT_ISSUE = "payment_issue"
    OTHER = "other"

class ComplaintStatus:
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    CLOSED = "closed"
