#!/bin/sh
# Rattrapage : copie dans votre dépôt rhpilot l'état complet du code à la fin d'une étape.
# Usage : sh catch-up.sh 05   (05, 06, 07 ou 08). Vos fichiers modifiés sont écrasés : committez avant.
set -eu
STEP=${1:-}
SRC="$(cd "$(dirname "$0")" && pwd)/solutions/$STEP"
DEST=${RHPILOT_DIR:-$HOME/byte-layers/quality-day/rhpilot}
[ -d "$SRC" ] || { echo "Étape inconnue : « $STEP ». Choisissez 05, 06, 07 ou 08."; exit 1; }
[ -d "$DEST/.git" ] || { echo "Le dépôt $DEST n'existe pas : clonez-le d'abord (étape 01)."; exit 1; }
cp -R "$SRC/." "$DEST/"
echo "État de fin d'étape $STEP copié dans $DEST. Relisez git status, puis committez sur votre branche."
