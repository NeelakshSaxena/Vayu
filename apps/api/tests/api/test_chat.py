import pytest
from unittest.mock import patch, AsyncMock
from app.llm.providers.openrouter import OpenRouterProvider

@pytest.fixture
def mock_openrouter():
    with patch("app.api.chat.router.llm_provider") as mock:
        mock.generate = AsyncMock(return_value="Mocked response")
        
        async def mock_generate_stream(*args, **kwargs):
            yield "Mocked "
            yield "stream "
            yield "response"
            
        mock.generate_stream = mock_generate_stream
        yield mock

def test_chat_rest(client, mock_openrouter):
    response = client.post("/api/chat/", json={"message": "Hello"})
    assert response.status_code == 200
    assert response.json() == {"reply": "Mocked response"}
    mock_openrouter.generate.assert_called_once()

def test_chat_websocket(client, mock_openrouter):
    with client.websocket_connect("/api/chat/ws") as websocket:
        websocket.send_json({"message": "Hello stream"})
        data1 = websocket.receive_text()
        data2 = websocket.receive_text()
        data3 = websocket.receive_text()
        assert data1 == "Mocked "
        assert data2 == "stream "
        assert data3 == "response"
