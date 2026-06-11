from sqlalchemy.orm import Session
from . import models, schemas

# =============================================================================
# CANDIDATE CRUD (Phase 1)
# =============================================================================

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


# =============================================================================
# INTERVIEW CRUD (Phase 2)
# =============================================================================

def _attach_candidate_name(db_interview):
    """Helper: attach candidate_name field from the ORM relationship."""
    if db_interview and db_interview.candidate:
        db_interview.candidate_name = db_interview.candidate.full_name
    elif db_interview:
        db_interview.candidate_name = "Unknown"
    return db_interview

def create_interview(db: Session, interview: schemas.InterviewCreate):
    """Create a new interview record linked to a candidate."""
    db_interview = models.Interview(
        candidate_id=interview.candidate_id,
        interview_type=interview.interview_type,
        interviewer_name=interview.interviewer_name,
        interview_date=interview.interview_date,
        status=interview.status,
        notes=interview.notes
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return _attach_candidate_name(db_interview)

def get_interview(db: Session, interview_id: int):
    """Retrieve a single interview by its primary key ID."""
    db_interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    return _attach_candidate_name(db_interview)

def get_interviews(db: Session, skip: int = 0, limit: int = 200):
    """Retrieve all interviews across all candidates."""
    interviews = db.query(models.Interview).offset(skip).limit(limit).all()
    for interview in interviews:
        _attach_candidate_name(interview)
    return interviews

def get_interviews_by_candidate(db: Session, candidate_id: int):
    """Retrieve all interviews for a specific candidate, ordered newest first."""
    interviews = (
        db.query(models.Interview)
        .filter(models.Interview.candidate_id == candidate_id)
        .order_by(models.Interview.interview_date.desc())
        .all()
    )
    for interview in interviews:
        _attach_candidate_name(interview)
    return interviews

def update_interview(db: Session, interview_id: int, interview_update: schemas.InterviewUpdate):
    """Update fields of an existing interview (partial update supported)."""
    db_interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not db_interview:
        return None
    
    update_data = interview_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_interview, key, value)
    
    db.commit()
    db.refresh(db_interview)
    return _attach_candidate_name(db_interview)

def delete_interview(db: Session, interview_id: int):
    """Delete an interview record from the database."""
    db_interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not db_interview:
        return None
    db.delete(db_interview)
    db.commit()
    return db_interview

def get_interview_count(db: Session) -> int:
    """Return total number of interviews in the database."""
    return db.query(models.Interview).count()

# =============================================================================
# EVALUATION CRUD (Phase 3)
# =============================================================================

def _calculate_overall_score(eval_data: dict) -> int:
    """Helper to compute the average of the 6 evaluation metrics."""
    scores = [
        eval_data.get('technical', 0),
        eval_data.get('communication', 0),
        eval_data.get('confidence', 0),
        eval_data.get('problem_solving', 0),
        eval_data.get('leadership', 0),
        eval_data.get('learning_ability', 0)
    ]
    return int(sum(scores) / len(scores))

def get_evaluation_by_candidate(db: Session, candidate_id: int):
    """Retrieve the single evaluation for a candidate."""
    return db.query(models.Evaluation).filter(models.Evaluation.candidate_id == candidate_id).first()

def create_evaluation(db: Session, evaluation: schemas.EvaluationCreate):
    """Add a new evaluation scorecard for a candidate."""
    eval_data = evaluation.model_dump()
    overall = _calculate_overall_score(eval_data)
    
    db_eval = models.Evaluation(
        candidate_id=evaluation.candidate_id,
        technical=evaluation.technical,
        communication=evaluation.communication,
        confidence=evaluation.confidence,
        problem_solving=evaluation.problem_solving,
        leadership=evaluation.leadership,
        learning_ability=evaluation.learning_ability,
        comments=evaluation.comments,
        overall_score=overall
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    return db_eval

def update_evaluation(db: Session, evaluation_id: int, evaluation_update: schemas.EvaluationUpdate):
    """Update an existing evaluation scorecard."""
    db_eval = db.query(models.Evaluation).filter(models.Evaluation.id == evaluation_id).first()
    if not db_eval:
        return None
    
    update_data = evaluation_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_eval, key, value)
        
    # Recalculate overall score after update
    current_data = {
        'technical': db_eval.technical,
        'communication': db_eval.communication,
        'confidence': db_eval.confidence,
        'problem_solving': db_eval.problem_solving,
        'leadership': db_eval.leadership,
        'learning_ability': db_eval.learning_ability,
    }
    db_eval.overall_score = _calculate_overall_score(current_data)
    
    db.commit()
    db.refresh(db_eval)
    return db_eval

