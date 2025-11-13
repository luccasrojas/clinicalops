from fastapi import APIRouter, HTTPException
from modules.transcribe_module import transcribe_audio, generate_clinical_note
from data.prompt import system_prompt, default_clinical_note_example
import json

router = APIRouter()

@router.post("/transcribe")
def transcribe_endpoint(payload: dict):
    """
    Transcribes an audio file from a given URL.
    Expects: {"audio_url": "https://example.com/audio.mp3"}
    """
    audio_url = payload.get("audio_url")
    if not audio_url:
        raise HTTPException(status_code=400, detail="Missing 'audio_url' in request body")

    try:
        transcription = transcribe_audio(audio_url)
        return {"status": "success", "transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clinical-note")
def clinical_note_endpoint(payload: dict):
    """
    Generates a clinical note from a given transcription.
    Expects: {"transcription": "... text ..."}
    """
    transcription = payload.get("transcription")
    clinical_note_example = payload.get("clinical_note_example", default_clinical_note_example)
    if not transcription:
        raise HTTPException(status_code=400, detail="Missing 'transcription' in request body")

    try:
        clinical_note = generate_clinical_note(transcription, system_prompt, clinical_note_example)
        print("Clinical Note before returning in clinical_note_endpoint:", clinical_note)

        # Convert to an ordered string with pretty indentation and preserved accents
        clinical_note_str = json.dumps(
            clinical_note,
            ensure_ascii=False,
            indent=2
        )

        return {"status": "success", 
                "clinical_note": clinical_note, # returning both formats, the object and the string
                "clinical_note_str": clinical_note_str
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Simplest way to test is with get routes and print statements

audio_url_test="https://ohio.stream-io-cdn.com/1433144/video/recordings/audio_room_1_dtxQ4PTcFRTweqGBx5TpN/rec_audio_room_1_dtxQ4PTcFRTweqGBx5TpN_audio_1760301883205.mp3?Expires=1761511570&Signature=b-j8vS6Q3bDkuPvLLhTqllXYddrBNNydJcc~MOsyDDhvr-zU-TRFNv4wmBKqkUNzLp5yOzfIBop4o12~H3DUbgSFAlKlrgZIr5ECtO6i0ycZn25qGwUpZF~O3r9auHeJ1NCy6VlwioPoX8UgdSgoy1vXapU0TuvPD0MXbtZc8ld7KI9WmBbn5~hpPIVdYjTFfx-FWHVVUXrbLw1BNKmkfwh3VhjYe8BAa2YIy~7BrJrs5LUyTmfYXIMMpijoO3Z4YFJ2x0m8OaQpnsDzBlaOe6qBioOcIMUzdO9PPAIGkndLvcqwLDkEv9QxNoXm4Z9Cw~aJlJgxTq2q-5EUIqNK4A__&Key-Pair-Id=APKAIHG36VEWPDULE23Q"

@router.get("/test-transcribe")
def test_transcribe():
    try:
        transcription = transcribe_audio(audio_url_test)
        print("Transcription:", transcription)
        return {"status": "success", "transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Example payload from a real transcription
payload_test={"status":"success","transcription":"SpeakerA: Muy simple hecha por José para probar la API de transcription.\n\nSpeakerB: De transcripción en el servidor.\n\nSpeakerA: De Google Cloud.\n\n"}

@router.get("/test-clinical-note")
def test_clinical_note():
    try:
        clinical_note = generate_clinical_note(payload_test["transcription"], system_prompt)
        print("Clinical Note:", clinical_note)
        return {"status": "success", "clinical_note": clinical_note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# EXAMPLE OUTPUT FROM TEST

# {"status":"success","clinical_note":{"datos_personales":{},"motivo_consulta":"Muy simple hecha por José para probar la API de transcription.","enfermedad_actual":"No se documenta información clínica sobre inicio, evolución, síntomas, factores asociados, severidad, tratamientos previos ni respuesta en la transcripción disponible al 13/10/2025.","notas_calidad_datos":"La transcripción no contiene datos clínicos del paciente (edad, sexo, síntomas, signos, antecedentes, examen físico, diagnósticos ni plan). No es posible completar la nota clínica."}}