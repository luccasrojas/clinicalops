import os
from dotenv import load_dotenv
import assemblyai as aai
from openai import OpenAI
import json
from datetime import datetime

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
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

def generate_temporal_context():
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    dias = [
        "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"
    ]

    hoy = datetime.now()
    dia_semana = dias[hoy.weekday()]
    mes = meses[hoy.month - 1]
    fecha = f"{hoy.day} de {mes} de {hoy.year} {hoy.strftime('%H:%M')}"
    return f"hoy es {dia_semana}, {fecha}."

def generate_clinical_note(transcription, prompt, clinical_note_example):
    client = OpenAI(api_key=OPENAI_API_KEY)

    temporal_context = generate_temporal_context()
    formatted_prompt = prompt.format(temporal_context=temporal_context, clinical_note_example=clinical_note_example)

    completion = client.responses.create(
        model="gpt-5",
        reasoning={"effort": "minimal"},
        input=[
            {
                "role": "system",
                "content": formatted_prompt,
            },
            {
                "role": "user",
                "content": (
                    transcription
                ),
            },
        ],
        text={"format": {"type": "json_object"}},
    )
    
    # Log the raw output for debugging
    print("Raw completion output:", completion.output[1].content[0].text)

    data = json.loads(completion.output[1].content[0].text, 
                      # to preserve order of keys in Python
                      object_pairs_hook=dict)
    
    # Debug: print the generated JSON data
    print("Generated clinical note JSON:", json.dumps(data, indent=2, ensure_ascii=False))

    return data
