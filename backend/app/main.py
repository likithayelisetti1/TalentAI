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
    description="Backend services for Candidate Management (Phase 1)",
    version="1.0.0"
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
        "message": "Welcome to the Interview Intelligence Platform API",
        "docs": "Interact with the APIs at http://127.0.0.1:8000/docs"
    }

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
