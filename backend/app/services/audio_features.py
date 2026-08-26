"""
NeuroSense AI - Audio Feature Extraction
Extracts acoustic biomarkers from audio using librosa + scipy.
"""
import numpy as np
import librosa
import logging

logger = logging.getLogger(__name__)


def extract_audio_features(audio_path: str) -> dict:
    """
    Extract acoustic biomarkers from a WAV/WebM audio file.

    Returns dict with:
        - total_duration_s
        - pause_count
        - total_pause_duration_s
        - average_pause_duration_s
        - silence_percentage
        - speaking_rate_proxy  (ratio of voiced frames)
    """
    try:
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        total_duration = librosa.get_duration(y=y, sr=sr)

        if total_duration < 0.5:
            return _empty_features()

        # Energy-based silence detection
        frame_length = 512
        hop_length = 256
        energy = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]

        # Threshold: 10th percentile of non-zero energy
        threshold = np.percentile(energy[energy > 0], 10) if np.any(energy > 0) else 0.001
        silence_frames = energy < threshold
        frame_duration = hop_length / sr

        # Detect pause segments (consecutive silence > 0.5s)
        PAUSE_MIN_DURATION = 0.5  # seconds
        PAUSE_MIN_FRAMES = int(PAUSE_MIN_DURATION / frame_duration)

        pauses = []
        in_pause = False
        pause_start = 0

        for i, is_silent in enumerate(silence_frames):
            if is_silent and not in_pause:
                in_pause = True
                pause_start = i
            elif not is_silent and in_pause:
                pause_len = i - pause_start
                if pause_len >= PAUSE_MIN_FRAMES:
                    pauses.append(pause_len * frame_duration)
                in_pause = False

        # Handle pause at end
        if in_pause:
            pause_len = len(silence_frames) - pause_start
            if pause_len >= PAUSE_MIN_FRAMES:
                pauses.append(pause_len * frame_duration)

        pause_count = len(pauses)
        total_pause_duration = sum(pauses)
        avg_pause_duration = float(np.mean(pauses)) if pauses else 0.0

        # Silence percentage
        total_silence_frames = int(np.sum(silence_frames))
        silence_pct = (total_silence_frames * frame_duration / total_duration) * 100

        return {
            "total_duration_s": round(total_duration, 2),
            "pause_count": pause_count,
            "total_pause_duration_s": round(total_pause_duration, 2),
            "average_pause_duration_s": round(avg_pause_duration, 3),
            "silence_percentage": round(min(silence_pct, 100.0), 1),
        }

    except Exception as e:
        logger.error(f"Audio feature extraction failed: {e}")
        return _empty_features()


def _empty_features() -> dict:
    return {
        "total_duration_s": 0.0,
        "pause_count": 0,
        "total_pause_duration_s": 0.0,
        "average_pause_duration_s": 0.0,
        "silence_percentage": 0.0,
    }
