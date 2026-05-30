from sqlalchemy import Column, Integer, String
from .database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    college = Column(String, nullable=True)
    skills = Column(String, nullable=True)  # Commma-separated list of skills, e.g., "Python, FastAPI, SQL"
    experience_years = Column(Integer, default=0)
