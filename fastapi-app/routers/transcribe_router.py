from fastapi import APIRouter, HTTPException
from modules.transcribe_module import transcribe_audio, generate_clinical_note
from data.prompts import SYSTEM_PROMPT, CLINICAL_NOTE_EXAMPLE
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
    clinical_note_example = payload.get("clinical_note_example", CLINICAL_NOTE_EXAMPLE)
    if not transcription:
        raise HTTPException(status_code=400, detail="Missing 'transcription' in request body")

    try:
        clinical_note = generate_clinical_note(transcription, SYSTEM_PROMPT, clinical_note_example)
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
