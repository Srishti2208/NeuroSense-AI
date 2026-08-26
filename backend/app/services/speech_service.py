"""
NeuroSense AI - Speech Analysis Service
Transcribes audio and extracts linguistic biomarkers.
Falls back to demo mode if Whisper is unavailable.
"""
import re
import math
import logging
import os
import random
from typing import Optional

logger = logging.getLogger(__name__)

FILLER_WORDS = {"um", "uh", "er", "like", "you know", "hmm", "ah", "uhh", "umm"}

# ── Whisper loading (optional) ────────────────────────────────────────────────
_whisper_model = None
WHISPER_AVAILABLE = False

try:
    import whisper as openai_whisper
    WHISPER_AVAILABLE = True
    logger.info("✅ OpenAI Whisper available")
except ImportError:
    try:
        from faster_whisper import WhisperModel as FasterWhisper
        WHISPER_AVAILABLE = True
        logger.info("✅ Faster-Whisper available")
    except ImportError:
        logger.warning("⚠️  Whisper not installed — demo mode will be used for speech analysis")


def _load_whisper():
    global _whisper_model
    if _whisper_model is None and WHISPER_AVAILABLE:
        try:
            import whisper as openai_whisper
            model_name = os.getenv("WHISPER_MODEL", "base")
            logger.info(f"Loading Whisper model '{model_name}'...")
            _whisper_model = openai_whisper.load_model(model_name)
            logger.info("✅ Whisper model loaded")
        except Exception:
            try:
                from faster_whisper import WhisperModel
                _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
                logger.info("✅ Faster-Whisper model loaded")
            except Exception as e:
                logger.error(f"Failed to load any Whisper model: {e}")
    return _whisper_model


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio file; returns empty string if unavailable."""
    if not WHISPER_AVAILABLE:
        return ""

    model = _load_whisper()
    if model is None:
        return ""

    try:
        import whisper as openai_whisper
        result = model.transcribe(audio_path, language="en")
        return result.get("text", "").strip()
    except Exception:
        try:
            segments, _ = model.transcribe(audio_path, language="en")
            return " ".join(seg.text for seg in segments).strip()
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return ""


# ── Linguistic feature extraction ─────────────────────────────────────────────

def extract_linguistic_features(transcript: str, duration_s: float) -> dict:
    """
    Extract NLP biomarkers from transcript text.
    """
    if not transcript or not transcript.strip():
        return _empty_linguistic()

    text = transcript.lower().strip()

    # Word tokenization
    words = re.findall(r"\b[a-z']+\b", text)
    total_words = len(words)

    if total_words == 0:
        return _empty_linguistic()

    unique_words = len(set(words))
    ttr = unique_words / total_words

    # Vocabulary richness (MTLD approximation — simplified TTR)
    vocab_richness = min(ttr * 1.2, 1.0)  # slight normalization

    # WPM
    duration_min = max(duration_s / 60, 0.01)
    wpm = total_words / duration_min

    # Filler words
    filler_count = sum(1 for w in words if w in FILLER_WORDS)

    # Repeated words (appear > 2x and not stop words)
    STOP_WORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "at",
                  "to", "for", "of", "is", "it", "i", "my", "me", "was", "had"}
    word_freq = {}
    for w in words:
        if w not in STOP_WORDS:
            word_freq[w] = word_freq.get(w, 0) + 1
    repeated_words = sum(1 for cnt in word_freq.values() if cnt > 2)

    # Sentence-level features
    sentences = re.split(r'[.!?]+', transcript.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    avg_sentence_length = (
        sum(len(re.findall(r"\b\w+\b", s)) for s in sentences) / len(sentences)
        if sentences else 0.0
    )

    return {
        "total_words": total_words,
        "unique_words": unique_words,
        "ttr": round(ttr, 4),
        "vocab_richness": round(vocab_richness, 4),
        "wpm": round(wpm, 1),
        "filler_words": filler_count,
        "repeated_words": repeated_words,
        "avg_sentence_length": round(avg_sentence_length, 1),
    }


def _empty_linguistic() -> dict:
    return {
        "total_words": 0,
        "unique_words": 0,
        "ttr": 0.0,
        "vocab_richness": 0.0,
        "wpm": 0.0,
        "filler_words": 0,
        "repeated_words": 0,
        "avg_sentence_length": 0.0,
    }


# ── Demo Mode Fallback ─────────────────────────────────────────────────────────

DEMO_TRANSCRIPTS = [
    ("Yesterday morning I woke up around seven, had some coffee and toast. "
     "I, um, then took my dog for a walk in the park. It was a beautiful morning, "
     "you know, the weather was really nice. After that I came home and read the newspaper "
     "for a while, then got ready for my appointment at the doctor's office."),

    ("My favorite memory is from my daughter's wedding, um, about ten years ago now. "
     "We were in the garden and the weather was perfect. I remember the flowers, "
     "you know, they were roses mostly, pink and white. Everyone was so happy. "
     "I danced with my wife and... uh... I think that was one of the best days of my life."),

    ("In the morning I usually have breakfast, uh, cereal or eggs sometimes. "
     "Then I watch the news. Um, yesterday I also called my son. He lives, uh, "
     "quite far away now. We talked for a while about, you know, general things. "
     "Then I went to the grocery store in the afternoon."),
]


def generate_demo_analysis(duration_s: float = 45.0) -> dict:
    """
    Produce a realistic-looking demo speech analysis without Whisper.
    Values are randomized within plausible ranges for a healthy older adult.
    """
    transcript, _ = random.choice(DEMO_TRANSCRIPTS), None

    ling = extract_linguistic_features(transcript, duration_s)

    pause_count = random.randint(3, 9)
    avg_pause = round(random.uniform(0.4, 0.9), 2)
    silence_pct = round(random.uniform(15, 35), 1)

    insight = (
        f"[DEMO MODE] Speech analysis simulated. "
        f"Detected {pause_count} pauses, {ling['filler_words']} filler words, "
        f"vocabulary TTR of {ling['ttr']:.2f}, "
        f"estimated {ling['wpm']:.0f} words per minute."
    )

    return {
        "transcript": f"[DEMO TRANSCRIPT] {transcript}",
        "speech_pauses": pause_count,
        "average_pause_duration": avg_pause,
        "vocab_richness": ling["vocab_richness"],
        "wpm": ling["wpm"],
        "silence_percentage": silence_pct,
        "filler_words": ling["filler_words"],
        "total_words": ling["total_words"],
        "unique_words": ling["unique_words"],
        "ttr": ling["ttr"],
        "avg_sentence_length": ling["avg_sentence_length"],
        "repeated_words": ling["repeated_words"],
        "summary_insight": insight,
        "demo_mode": True,
    }


def analyze_speech(audio_path: str, duration_s: float = 0.0) -> dict:
    """
    Full speech analysis pipeline.
    Falls back gracefully to demo mode if Whisper is unavailable.
    """
    from app.services.audio_features import extract_audio_features

    # Extract acoustic features
    acoustic = extract_audio_features(audio_path)
    if duration_s <= 0:
        duration_s = acoustic.get("total_duration_s", 30.0)

    # Transcribe
    transcript = transcribe_audio(audio_path)

    if not transcript and not WHISPER_AVAILABLE:
        # Full demo mode
        return generate_demo_analysis(duration_s)

    if not transcript:
        transcript = "[Transcription unavailable]"

    # Extract linguistic features from transcript
    ling = extract_linguistic_features(transcript, duration_s)

    pause_count = acoustic.get("pause_count", 0)
    avg_pause = acoustic.get("average_pause_duration_s", 0.0)
    silence_pct = acoustic.get("silence_percentage", 0.0)

    insight = (
        f"Speech analysis complete. "
        f"Detected {pause_count} speech pauses (avg {avg_pause:.2f}s), "
        f"{ling['filler_words']} filler words, "
        f"vocabulary diversity (TTR) of {ling['ttr']:.2f}, "
        f"speaking rate of {ling['wpm']:.0f} WPM."
    )

    return {
        "transcript": transcript,
        "speech_pauses": pause_count,
        "average_pause_duration": avg_pause,
        "vocab_richness": ling["vocab_richness"],
        "wpm": ling["wpm"],
        "silence_percentage": silence_pct,
        "filler_words": ling["filler_words"],
        "total_words": ling["total_words"],
        "unique_words": ling["unique_words"],
        "ttr": ling["ttr"],
        "avg_sentence_length": ling["avg_sentence_length"],
        "repeated_words": ling["repeated_words"],
        "summary_insight": insight,
        "demo_mode": False,
    }
