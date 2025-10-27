import os
import assemblyai as aai

ASSEMBLY_KEY = os.getenv("ASSEMBLY_KEY")

def transcribe_audio(audio_url):
    aai.settings.api_key = ASSEMBLY_KEY

    config = aai.TranscriptionConfig(speech_model=aai.SpeechModel.universal, speaker_labels=True, language_code="es", speakers_expected=2)

    transcript = aai.Transcriber(config=config).transcribe(audio_url)
    if transcript.status == "error":
        raise RuntimeError(f"Transcription failed: {transcript.error}")

    full_text = ""
    for utterance in transcript.utterances:
        speaker = f"Speaker{utterance.speaker}"
        text = utterance.text
        
        full_text += f"{speaker}: {text}\n\n"
    
    return full_text

def lambda_handler(event, context):
    audio_url = event['audio_url']
    transcribed_text = transcribe_audio(audio_url)
    return {"statusCode": 200, "body": transcribed_text}
