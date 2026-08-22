#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.piper-venv"
MODEL_DIR="$ROOT_DIR/.voice-models"
OUTPUT_DIR="$ROOT_DIR/voice-samples"
PIPER_REPO="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"

mkdir -p "$MODEL_DIR" "$OUTPUT_DIR"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --quiet --upgrade pip
"$VENV_DIR/bin/python" -m pip install --quiet piper-tts

download_voice() {
  local relative_path="$1"
  local filename="${relative_path##*/}"

  if [ ! -f "$MODEL_DIR/$filename" ]; then
    curl --fail --location --retry 3 \
      "$PIPER_REPO/$relative_path" \
      --output "$MODEL_DIR/$filename"
  fi

  if [ ! -f "$MODEL_DIR/$filename.json" ]; then
    curl --fail --location --retry 3 \
      "$PIPER_REPO/$relative_path.json" \
      --output "$MODEL_DIR/$filename.json"
  fi
}

generate_sample() {
  local language="$1"
  local relative_path="$2"
  local text="$3"
  local filename="${relative_path##*/}"
  local wav_file="$OUTPUT_DIR/$language.wav"
  local mp3_file="$OUTPUT_DIR/$language.mp3"

  download_voice "$relative_path"

  printf '%s\n' "$text" | "$VENV_DIR/bin/python" -m piper \
    --model "$MODEL_DIR/$filename" \
    --config "$MODEL_DIR/$filename.json" \
    --output_file "$wav_file"

  ffmpeg -hide_banner -loglevel error -y \
    -i "$wav_file" -codec:a libmp3lame -b:a 96k "$mp3_file"

  rm -f "$wav_file"
  printf 'HOTOVO: %s\n' "$mp3_file"
}

generate_sample cs "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx" \
  "Dvacet šest. Sto. Sto osmdesát. Bez skóre. Vítěz."
generate_sample en "en/en_GB/cori/high/en_GB-cori-high.onnx" \
  "Twenty-six. One hundred. One hundred and eighty. Bust. Winner."
generate_sample de "de/de_DE/kerstin/low/de_DE-kerstin-low.onnx" \
  "Sechsundzwanzig. Einhundert. Einhundertachtzig. Bust. Gewinner."
generate_sample es "es/es_AR/daniela/high/es_AR-daniela-high.onnx" \
  "Veintiséis. Cien. Ciento ochenta. Sin puntuación. Victoria."
generate_sample nl "nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx" \
  "Zesentwintig. Honderd. Honderdtachtig. Geen score. Winnaar."
generate_sample ru "ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx" \
  "Двадцать шесть. Сто. Сто восемьдесят. Без очков. Победитель."
generate_sample zh "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx" \
  "二十六。 一百。 一百八十。 爆掉。 胜利。"

printf '\nVZORKY JSOU V: %s\n' "$OUTPUT_DIR"
