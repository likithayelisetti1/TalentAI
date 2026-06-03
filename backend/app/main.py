from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db, Base
from . import crud, models, schemas

# Automatically trigger database table creation on startup if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Interview Intelligence Platform API",
    description="Backend services for Candidate Management (Phase 1) & Interview Management (Phase 2)",
    version="2.0.0"
)

# Configure CORS so our local frontend can query the APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from local HTML file or dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Interview Intelligence Platform API v2.0",
        "docs": "Interact with the APIs at http://127.0.0.1:8080/docs",
        "phase": "Phase 2 - Interview Management Active"
    }

# =============================================================================
# CANDIDATE ENDPOINTS (Phase 1)
# =============================================================================

# 1. Add Candidate
@app.post("/api/candidates", response_model=schemas.CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(candidate: schemas.CandidateCreate, db: Session = Depends(get_db)):
    # Check for duplicate email address
    existing_candidate = crud.get_candidate_by_email(db, email=candidate.email)
    if existing_candidate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A candidate with this email address is already registered."
        )
    return crud.create_candidate(db=db, candidate=candidate)

# 2. Get All Candidates
@app.get("/api/candidates", response_model=List[schemas.CandidateResponse])
def read_candidates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_candidates(db, skip=skip, limit=limit)

# 3. Get Candidate By ID
@app.get("/api/candidates/{candidate_id}", response_model=schemas.CandidateResponse)
def read_candidate(candidate_id: int, db: Session = Depends(get_db)):
    db_candidate = crud.get_candidate(db, candidate_id=candidate_id)
    if not db_candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
    return db_candidate

# 4. Update Candidate
@app.put("/api/candidates/{candidate_id}", response_model=schemas.CandidateResponse)
def update_candidate(candidate_id: int, candidate: schemas.CandidateUpdate, db: Session = Depends(get_db)):
    # Verify email conflict if email is being updated
    if candidate.email is not None:
        existing_email = crud.get_candidate_by_email(db, email=candidate.email)
        if existing_email and existing_email.id != candidate_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already in use by another candidate."
            )
            
    db_candidate = crud.update_candidate(db, candidate_id=candidate_id, candidate_update=candidate)
    if not db_candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
    return db_candidate

# 5. Delete Candidate
@app.delete("/api/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    db_candidate = crud.delete_candidate(db, candidate_id=candidate_id)
    if not db_candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
    return None

# 6. Get Interview History for a Candidate
@app.get("/api/candidates/{candidate_id}/interviews", response_model=List[schemas.InterviewResponse])
def read_candidate_interviews(candidate_id: int, db: Session = Depends(get_db)):
    # Verify the candidate exists first
    db_candidate = crud.get_candidate(db, candidate_id=candidate_id)
    if not db_candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found."
        )
    return crud.get_interviews_by_candidate(db, candidate_id=candidate_id)


# =============================================================================
# INTERVIEW ENDPOINTS (Phase 2)
# =============================================================================

# 1. Create Interview
@app.post("/api/interviews", response_model=schemas.InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(interview: schemas.InterviewCreate, db: Session = Depends(get_db)):
    # Validate interview type
    if interview.interview_type not in schemas.INTERVIEW_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid interview type. Must be one of: {', '.join(schemas.INTERVIEW_TYPES)}"
        )
    # Validate candidate exists
    db_candidate = crud.get_candidate(db, candidate_id=interview.candidate_id)
    if not db_candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cannot schedule interview: candidate not found."
        )
    return crud.create_interview(db=db, interview=interview)

# 2. Get All Interviews
@app.get("/api/interviews", response_model=List[schemas.InterviewResponse])
def read_interviews(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return crud.get_interviews(db, skip=skip, limit=limit)

# 3. Get Single Interview By ID
@app.get("/api/interviews/{interview_id}", response_model=schemas.InterviewResponse)
def read_interview(interview_id: int, db: Session = Depends(get_db)):
    db_interview = crud.get_interview(db, interview_id=interview_id)
    if not db_interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )
    return db_interview

# 4. Update Interview
@app.put("/api/interviews/{interview_id}", response_model=schemas.InterviewResponse)
def update_interview(interview_id: int, interview: schemas.InterviewUpdate, db: Session = Depends(get_db)):
    # Validate interview type if provided
    if interview.interview_type and interview.interview_type not in schemas.INTERVIEW_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid interview type. Must be one of: {', '.join(schemas.INTERVIEW_TYPES)}"
        )
    # Validate status if provided
    if interview.status and interview.status not in schemas.INTERVIEW_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(schemas.INTERVIEW_STATUSES)}"
        )
    db_interview = crud.update_interview(db, interview_id=interview_id, interview_update=interview)
    if not db_interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )
    return db_interview

# 5. Delete Interview
@app.delete("/api/interviews/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(interview_id: int, db: Session = Depends(get_db)):
    db_interview = crud.delete_interview(db, interview_id=interview_id)
    if not db_interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )
    return None


# =============================================================================
# STATS ENDPOINT (For sidebar Quick Metrics)
# =============================================================================

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Return aggregate counts for the dashboard sidebar."""
    candidates = crud.get_candidates(db, limit=10000)
    total_candidates = len(candidates)
    total_interviews = crud.get_interview_count(db)
    
    avg_experience = 0
    if total_candidates > 0:
        avg_experience = round(
            sum(c.experience_years for c in candidates) / total_candidates, 1
        )
    
    return {
        "total_candidates": total_candidates,
        "total_interviews": total_interviews,
        "avg_experience": avg_experience
    }

