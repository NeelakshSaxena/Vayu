from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_tools(current_user: dict = Depends(get_current_user)):
    """
    Placeholder endpoint to retrieve available tools.
    """
    return {"message": "Tools endpoint placeholder"}
