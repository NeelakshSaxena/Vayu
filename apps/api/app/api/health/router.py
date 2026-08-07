from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def health_check():
    """
    Check the health status of the API.
    """
    return {"status": "ok"}
