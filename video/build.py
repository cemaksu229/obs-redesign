"""Montaj: kayıt kareleri + cümle sesleri + altyazılar -> MP4.

Kullanım: python3 build.py <kayıt_klasörü> <ses_klasörü> <çıktı.mp4>
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf

rec, audio_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(here, "script.json")))
frames = json.load(open(os.path.join(rec, "frames.json")))
cues = json.load(open(os.path.join(rec, "cues.json")))
durations = json.load(open(os.path.join(audio_dir, "durations.json")))
t0, end = frames["t0"], frames["end"]

# ---------- Görüntü: değişken süreli kareler ----------
lst = os.path.join(rec, "frames.txt")
items = [(f["t"] - t0, f["file"]) for f in frames["frames"]]
with open(lst, "w") as fh:
    # İlk kare, kayıt başlangıcından itibaren gösterilsin
    first_t, first_f = items[0]
    fh.write(f"file 'frames/{first_f}'\nduration {max(first_t, 0.04):.3f}\n")
    for i, (t, f) in enumerate(items):
        nxt = items[i + 1][0] if i + 1 < len(items) else end
        fh.write(f"file 'frames/{f}'\nduration {max(nxt - t, 0.001):.3f}\n")
    fh.write(f"file 'frames/{items[-1][1]}'\n")

# ---------- Ses: her cümle kendi başlangıcına ----------
sr = 24000
track = np.zeros(int((end + 0.5) * sr), dtype=np.float32)
for line in script:
    data, r = sf.read(os.path.join(audio_dir, f"{line['id']}.wav"), dtype="float32")
    assert r == sr
    start = int(cues[line["id"]] * sr)
    track[start:start + len(data)] += data[: len(track) - start]
peak = np.max(np.abs(track)) or 1
track = track / peak * 0.89
wav = os.path.join(rec, "voice.wav")
sf.write(wav, track, sr)

# ---------- Altyazı (ASS, siyah kutu) ----------
def ts(s):
    h = int(s // 3600); m = int(s % 3600 // 60); sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

def chunks(text, limit=74):
    # Uzun cümleleri noktalama işaretlerinden böl
    if len(text) <= limit:
        return [text]
    parts = re.split(r"(?<=[,:.;?!])\s+", text)
    out_, cur = [], ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > limit:
            out_.append(cur); cur = p
        else:
            cur = f"{cur} {p}".strip()
    if cur:
        out_.append(cur)
    return out_

ids = [l["id"] for l in script]
events = []
for i, line in enumerate(script):
    start = cues[line["id"]]
    stop = start + durations[line["id"]] + 0.15
    if i + 1 < len(script):
        stop = min(stop, cues[ids[i + 1]] - 0.05)
    pieces = chunks(line["text"])
    total = sum(len(p) for p in pieces)
    t = start
    for p in pieces:
        d = (stop - start) * len(p) / total
        events.append((t, t + d, p))
        t += d

ass = os.path.join(rec, "subs.ass")
with open(ass, "w") as fh:
    fh.write("""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,10,0,2,260,260,64,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
    for a, b, text in events:
        fh.write(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{text}\n")

# ---------- Birleştir ----------
cmd = [
    "ffmpeg", "-v", "error", "-y",
    "-f", "concat", "-safe", "0", "-i", lst,
    "-i", wav,
    "-vf", f"scale=1920:1080:flags=lanczos,fps=30,ass={ass}",
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-t", f"{end:.2f}", "-movflags", "+faststart", out,
]
subprocess.run(cmd, check=True, cwd=rec)
print("hazır:", out, f"{end:.1f} sn", len(events), "altyazı")
