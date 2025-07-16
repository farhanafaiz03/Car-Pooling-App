from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from app.db.models import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Commute.io API",
    description="Backend API for the Commute.io rideshare application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.rides import router as rides_router
from app.api.messages import router as messages_router
from app.api.cars import router as cars_router
from app.api.locations import router as locations_router
from app.api.ai_chat import router as ai_chat_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(rides_router, prefix="/api/rides", tags=["Rides"])
app.include_router(messages_router, prefix="/api/messages", tags=["Messages"])
app.include_router(cars_router, prefix="/api/cars", tags=["Cars"])
app.include_router(locations_router, prefix="/api/locations", tags=["Locations"])
app.include_router(ai_chat_router, prefix="/api/ai", tags=["AI Chat"])


@app.get("/")
async def root():
    """
    Root endpoint - API welcome message
    
    Purpose:
    - Confirms the API is accessible
    - Provides basic API information
    - Used for initial connectivity testing
    """
    return {"message": "Welcome to Commute.io API"}


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment
    
    Purpose:
    - Used by load balancers to check if the service is healthy
    - Monitoring systems can ping this to ensure API is running
    - DevOps teams use this for automated health checks
    - Returns 200 status if the API is operational
    """
    return {"status": "healthy", "message": "API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)