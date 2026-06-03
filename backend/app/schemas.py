from pydantic import BaseModel, Field
from typing import Optional, List

# =============================================================================
# CANDIDATE SCHEMAS (Phase 1)
# =============================================================================

# Base properties shared by all schemas
class CandidateBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Full name of the candidate")
    email: str = Field(..., description="Email address of the candidate")
    phone: Optional[str] = Field(None, description="Contact phone number")
    college: Optional[str] = Field(None, description="College or University name")
    skills: Optional[str] = Field(None, description="Comma-separated skills list")
    experience_years: int = Field(default=0, ge=0, description="Years of professional experience")

# Properties required on candidate creation
class CandidateCreate(CandidateBase):
    pass

# Properties to receive on candidate update (all optional)
class CandidateUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)

# Properties returned in API responses (includes database ID)
class CandidateResponse(CandidateBase):
    id: int

    class Config:
        from_attributes = True  # Support SQLAlchemy ORM mapping (from_orm in older Pydantic)


# =============================================================================
# INTERVIEW SCHEMAS (Phase 2)
# =============================================================================

# Allowed interview type values
INTERVIEW_TYPES = ["Structured", "Unstructured", "Hybrid"]

# Allowed interview status values
INTERVIEW_STATUSES = ["Scheduled", "Completed", "Cancelled"]

class InterviewBase(BaseModel):
    candidate_id: int = Field(..., description="ID of the candidate being interviewed")
    interview_type: str = Field(..., description="Type: Structured, Unstructured, or Hybrid")
    interviewer_name: str = Field(..., min_length=1, description="Name of the person conducting the interview")
    interview_date: str = Field(..., description="Date of interview in YYYY-MM-DD format")
    status: str = Field(default="Scheduled", description="Status: Scheduled, Completed, or Cancelled")
    notes: Optional[str] = Field(None, description="Interviewer notes and observations from the session")

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    interview_type: Optional[str] = None
    interviewer_name: Optional[str] = Field(None, min_length=1)
    interview_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: int
    candidate_name: Optional[str] = None  # Embedded for frontend display convenience

    class Config:
        from_attributes = True
