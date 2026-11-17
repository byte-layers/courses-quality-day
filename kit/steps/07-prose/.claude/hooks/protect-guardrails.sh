#!/bin/sh
# Hook PreToolUse de Claude Code : refuse que l'agent modifie les tests ou la configuration des outils.
# Claude Code envoie l'appel d'outil en JSON sur l'entrée standard ; seul le code de sortie 2 bloque.
path=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
case "$path" in
  */test/*|*/e2e/*|*/.gitea/*|*/eslint.config.js|*/sonar-project.properties|*/playwright.config.js)
    echo "Bloqué par le hook : $path est un garde-fou. Corrigez le code, ou demandez à un humain." >&2
    exit 2 ;;
esac
exit 0
