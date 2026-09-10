import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture
def mock_openrouter():
    with patch("app.api.chat.router.pipeline.llm_router.route", new_callable=AsyncMock) as mock_route, \
         patch("app.api.chat.router.pipeline.llm_router.route_stream") as mock_stream:
        mock_route.return_value = "Mocked response"
        
        async def mock_generate_stream(*args, **kwargs):
            yield "Mocked "
            yield "stream "
            yield "response"
            
        mock_stream.side_effect = mock_generate_stream
        yield mock_route

def test_chat_rest(client, mock_openrouter):
    response = client.post("/api/chat/", json={"message": "Hello"})
    assert response.status_code == 200
    assert response.json() == {"reply": "Mocked stream response"}

def test_chat_websocket(client, mock_openrouter):
    with client.websocket_connect("/api/chat/ws") as websocket:
        websocket.send_json({"type": "chat", "message": "Hello stream"})
        data1 = websocket.receive_text()
        data2 = websocket.receive_text()
        data3 = websocket.receive_text()
        assert data1 == '{"type":"start"}'
        assert data2 == '{"type":"token","content":"Mocked "}'
        assert data3 == '{"type":"token","content":"stream "}'
