from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def read_health():
    """Check the health of the API."""
    return {"status": "OK"} 