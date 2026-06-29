import queue
import subprocess
import sys
import threading


class TTSModule:
    """TTS worker aligned with legacy GUI behavior."""

    def __init__(self):
        self._tts_queue = queue.Queue()
        self._tts_thread = threading.Thread(target=self._tts_worker, daemon=True)
        self._tts_thread.start()

    def _tts_worker(self):
        while True:
            text = self._tts_queue.get()
            if text is None:
                break
            if not text.strip():
                continue
            try:
                script = f"""import pyttsx3
e = pyttsx3.init()
e.setProperty('rate', 150)
voices = e.getProperty('voices')
# Chọn giọng Anh (David, Zira, hoặc bất kỳ giọng nào có 'English' hoặc 'United States')
preferred_patterns = ['david', 'zira', 'english', 'united states', 'us']
selected = None
for voice in voices:
    name_lower = voice.name.lower()
    lang_lower = ''.join(voice.languages).lower() if voice.languages else ''
    for pattern in preferred_patterns:
        if pattern in name_lower or pattern in lang_lower:
            selected = voice
            break
    if selected:
        break
if selected:
    e.setProperty('voice', selected.id)
e.say({repr(text)})
e.runAndWait()
"""
                creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                subprocess.run(
                    [sys.executable, "-c", script],
                    timeout=30,
                    creationflags=creationflags,
                )
            except Exception:
                pass

    def speak(self, text):
        if not text or not text.strip():
            return
        while not self._tts_queue.empty():
            try:
                self._tts_queue.get_nowait()
            except queue.Empty:
                break
        self._tts_queue.put(text)

    def shutdown(self):
        self._tts_queue.put(None)
