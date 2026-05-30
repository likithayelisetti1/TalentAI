from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database file path inside the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./interview_intelligence.db"

# Create the engine. SQLite requires check_same_thread=False for multi-threaded FastAPI applications.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal creates database sessions to execute transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()

# Database Session Dependency to inject into API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
