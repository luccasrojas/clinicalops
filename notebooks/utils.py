import re
import os
import locale
from datetime import datetime
import tiktoken
import json
from mutagen import File

def deduplicate_tags(text):
    """Remove duplicate PII tags from text."""
    return re.sub(r'(?:\[[A-Z_]+\]\s*){2,}', lambda m: m.group(0).split()[0] + ' ', text)


def get_text_from_transcript(transcript):
    """Extract text with speaker tags from AssemblyAI transcript."""
    full_text = ""
    conversation = []
    for utterance in transcript.utterances:
                speaker = f"Speaker{utterance.speaker}"
                text = utterance.text
                
                conversation_entry = {
                    'speaker': speaker,
                    'text': text
                }
                conversation.append(conversation_entry)
                full_text += f"{speaker}: {text}\n\n"
    return deduplicate_tags(full_text)


def generate_temporal_context():
    """Generate temporal context for prompt."""
    locale.setlocale(locale.LC_TIME, "es_ES")
    hoy = datetime.now()
    dia_semana = hoy.strftime("%A")
    fecha = hoy.strftime("%d de %B de %Y %H:%M")
    return f"hoy es {dia_semana}, {fecha}."


def count_tokens(text, model="gpt-5"):
    """Count tokens in text using tiktoken."""
    try:
        codificador = tiktoken.encoding_for_model(model)
    except KeyError:
        codificador = tiktoken.get_encoding("cl100k_base")
    
    tokens = codificador.encode(text)
    return len(tokens)

def save_transcription(transcription, filename):
    """Save transcription to file."""
    with open(filename, "w", encoding="utf-8") as f:
        f.write(transcription)

def get_transcription(filename):
    """Get transcription from file."""
    if not os.path.exists(filename):
        return None
    with open(filename, "r", encoding="utf-8") as f:
        return f.read()

def save_clinical_note(clinical_note, filename):
    """Save clinical note to file."""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(clinical_note, f, ensure_ascii=False, indent=2)
        
def get_clinical_note(filename):
    """Get clinical note from file."""
    if not os.path.exists(filename):
        return None
    with open(filename, "r", encoding="utf-8") as f:
        return json.loads(f.read())    

def get_audio_length(audio_file):
    """Get audio length in seconds."""
    audio = File(audio_file)
    return audio.info.length