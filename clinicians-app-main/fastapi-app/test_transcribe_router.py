from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app, raise_server_exceptions=True)

# For now is only stored for 2 weeks at stream io (today is 2025-10-13)
# We should probably replace it with another permanent link to an audio test file later
audio_url_test="https://ohio.stream-io-cdn.com/1433144/video/recordings/audio_room_1_dtxQ4PTcFRTweqGBx5TpN/rec_audio_room_1_dtxQ4PTcFRTweqGBx5TpN_audio_1760301883205.mp3?Expires=1761511570&Signature=b-j8vS6Q3bDkuPvLLhTqllXYddrBNNydJcc~MOsyDDhvr-zU-TRFNv4wmBKqkUNzLp5yOzfIBop4o12~H3DUbgSFAlKlrgZIr5ECtO6i0ycZn25qGwUpZF~O3r9auHeJ1NCy6VlwioPoX8UgdSgoy1vXapU0TuvPD0MXbtZc8ld7KI9WmBbn5~hpPIVdYjTFfx-FWHVVUXrbLw1BNKmkfwh3VhjYe8BAa2YIy~7BrJrs5LUyTmfYXIMMpijoO3Z4YFJ2x0m8OaQpnsDzBlaOe6qBioOcIMUzdO9PPAIGkndLvcqwLDkEv9QxNoXm4Z9Cw~aJlJgxTq2q-5EUIqNK4A__&Key-Pair-Id=APKAIHG36VEWPDULE23Q"

def test_transcribe_endpoint():
    response = client.post("/api/transcribe", json={"audio_url": audio_url_test})

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    print(data["transcription"])

def test_clinical_note_endpoint():
    response = client.post(
        "/api/clinical-note",
        json={"transcription": "Speaker0: Hola\nSpeaker1: Buenos días"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "clinical_note" in data


# def test_transcribe_real_integration():
#     response = client.post("/transcribe", json={"audio_url": "https://example.com/sample.mp3"})
#     assert response.status_code == 200
#     assert "transcription" in response.json()

# # pytest -m "integration"