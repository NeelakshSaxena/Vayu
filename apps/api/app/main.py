from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.health.router import router as health_router
from app.api.chat.router import router as chat_router
from app.api.memory.router import router as memory_router
from app.api.tools.router import router as tools_router
from app.api.auth.router import router as auth_router

# Setup structured logging
logger = setup_logging(debug=settings.debug)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

# CORS Middleware (Allow frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be tightened in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Vayu API"}


# Include Routers
app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(memory_router, prefix="/api/memory", tags=["Memory"])
app.include_router(tools_router, prefix="/api/tools", tags=["Tools"])

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.app_name} API...")
