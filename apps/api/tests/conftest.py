import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

# Mock dependency
async def override_get_current_user():
    return {"user_id": "test_user", "roles": ["user"]}

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
