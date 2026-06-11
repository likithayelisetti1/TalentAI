from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    college = Column(String, nullable=True)
    skills = Column(String, nullable=True)  # Comma-separated list e.g. "Python, FastAPI, SQL"
    experience_years = Column(Integer, default=0)

    # One Candidate -> Many Interviews
    # cascade="all, delete-orphan" means deleting a candidate also deletes all their interviews
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    interview_type = Column(String, nullable=False)      # "Structured", "Unstructured", "Hybrid"
    interviewer_name = Column(String, nullable=False)
    interview_date = Column(String, nullable=False)      # Stored as YYYY-MM-DD string
    status = Column(String, default="Scheduled")        # "Scheduled", "Completed", "Cancelled"
    notes = Column(String, nullable=True)               # Interviewer's notes from the session

    # Link back to the parent Candidate
    candidate = relationship("Candidate", back_populates="interviews")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), unique=True, nullable=False)
    
    # Core scoring categories (0-100)
    technical = Column(Integer, default=0)
    communication = Column(Integer, default=0)
    confidence = Column(Integer, default=0)
    problem_solving = Column(Integer, default=0)
    leadership = Column(Integer, default=0)
    learning_ability = Column(Integer, default=0)
    
    # Computed overall score (can be updated dynamically or recalculated on save)
    overall_score = Column(Integer, default=0)
    
    comments = Column(String, nullable=True)
    
    candidate = relationship("Candidate", back_populates="evaluation")

Candidate.evaluation = relationship("Evaluation", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
