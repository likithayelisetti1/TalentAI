from sqlalchemy.orm import Session
from . import models, schemas

def get_candidate(db: Session, candidate_id: int):
    """Retrieve a single candidate by their primary key ID."""
    return db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()

def get_candidate_by_email(db: Session, email: str):
    """Retrieve a single candidate by their email address."""
    return db.query(models.Candidate).filter(models.Candidate.email == email).first()

def get_candidates(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve a list of candidates with offset and limit parameters."""
    return db.query(models.Candidate).offset(skip).limit(limit).all()

def create_candidate(db: Session, candidate: schemas.CandidateCreate):
    """Add a new candidate to the SQLite database."""
    db_candidate = models.Candidate(
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        college=candidate.college,
        skills=candidate.skills,
        experience_years=candidate.experience_years
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

def update_candidate(db: Session, candidate_id: int, candidate_update: schemas.CandidateUpdate):
    """Update details of an existing candidate."""
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        return None
    
    # Exclude parameters that were not passed in the request (partial updates)
    update_data = candidate_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_candidate, key, value)
        
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

def delete_candidate(db: Session, candidate_id: int):
    """Delete a candidate from the SQLite database."""
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        return None
    db.delete(db_candidate)
    db.commit()
    return db_candidate
