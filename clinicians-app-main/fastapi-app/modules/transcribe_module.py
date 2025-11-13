import os
from dotenv import load_dotenv
import assemblyai as aai
from pydantic import BaseModel
from openai import OpenAI
import json
from datetime import datetime
import locale


from data.prompt import system_prompt

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


# CUIDADO: locale.setlocale puede no funcionar en todos los sistemas operativos
# Failed to generate clinical note. Status: 500, Message: {"detail":"unsupported locale setting"}
# Ver mas aqui https://chatgpt.com/share/68f3e430-fae4-8011-b3c3-f25f5a3f769e
# def generate_temporal_context():
#     locale.setlocale(locale.LC_TIME, "es_ES")
#     hoy = datetime.now()
#     dia_semana = hoy.strftime("%A")
#     fecha = hoy.strftime("%d de %B de %Y %H:%M")
#     return f"hoy es {dia_semana}, {fecha}."
# NOTA: Alternativa sin usar locale con un brute force approach pero que funciona en todos los sistemas operativos
# se puede mejorar luego si es necesario
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


# audio_path=""    
# transcription = transcribe_audio(audio_path)
# histoiria_clinica = generate_historia_clinica(transcription, system_prompt)
# histoiria_clinica