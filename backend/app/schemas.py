from pydantic import BaseModel, Field
from typing import Optional

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
