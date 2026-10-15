"""Her cümleyi ayrı seslendirir (Kokoro, çevrimdışı) ve sürelerini durations.json'a yazar.

Kullanım: python3 tts.py <model.onnx> <voices.bin> <çıktı_klasörü> [ses]
"""
import json, sys, os
import soundfile as sf
from kokoro_onnx import Kokoro

model, voices, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "af_heart"
here = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(here, "script.json")))
os.makedirs(out, exist_ok=True)

k = Kokoro(model, voices)
durations = {}
for line in script:
    path = os.path.join(out, f"{line['id']}.wav")
    if not os.path.exists(path):
        samples, sr = k.create(line["text"], voice=voice, speed=1.0, lang="en-us")
        sf.write(path, samples, sr)
    info = sf.info(path)
    durations[line["id"]] = round(info.frames / info.samplerate, 3)
    print(line["id"], durations[line["id"]], flush=True)

json.dump(durations, open(os.path.join(out, "durations.json"), "w"), indent=1)
print("toplam", round(sum(durations.values()), 1), "sn")
