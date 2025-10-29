import os
import json
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
    try:
        # Parse input - handle both direct invocation and API Gateway format
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)  # Fallback to event itself for direct invocation

        audio_url = body.get('audio_url')

        if not audio_url:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'audio_url is required'})
            }

        transcribed_text = transcribe_audio(audio_url)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'transcription': transcribed_text})
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
