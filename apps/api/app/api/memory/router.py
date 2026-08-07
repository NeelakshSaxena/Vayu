from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_memory(current_user: dict = Depends(get_current_user)):
    """
    Placeholder endpoint to retrieve memory for the current user.
    """
    return {"message": "Memory endpoint placeholder"}
