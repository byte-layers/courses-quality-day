#!/bin/sh
# Câble l'environnement du lab RHPilot : comptes Gitea, dépôt, labels, issue du client,
# SonarQube (mot de passe, projet, jeton), secret du pipeline, runner.
# Relançable : ce qui existe déjà est conservé.
set -eu
cd "$(dirname "$0")"

G=http://localhost:3300
S=http://localhost:9300
REPO=rhpilot/rhpilot

say() { printf '\n== %s\n' "$1"; }
gen() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 14; }

# --- Mots de passe, générés une fois dans .env --------------------------------
if [ ! -f .env ]; then
  {
    echo "# Généré par init.sh. Ne pas versionner."
    echo "GITEA_ADMIN_PASSWORD=$(gen)-Aa1"
    echo "ALICE_PASSWORD=$(gen)-Aa1"
    echo "BOB_PASSWORD=$(gen)-Aa1"
    echo "SONAR_PASSWORD=$(gen)-Aa1"
  } > .env
fi
# shellcheck disable=SC1091
. ./.env

say "Démarrage des services (le premier lancement télécharge les images : plusieurs minutes)"
docker compose up -d --build db app gitea sonarqube

printf 'Attente de Gitea'
until curl -fs "$G/api/v1/version" >/dev/null 2>&1; do printf '.'; sleep 2; done; echo

gitea() { docker compose exec -T -u git gitea gitea "$@"; }
api() { # api UTILISATEUR:MOT_DE_PASSE MÉTHODE CHEMIN [JSON]
  curl -fsS -u "$1" -X "$2" -H 'Content-Type: application/json' "$G/api/v1$3" ${4:+-d "$4"}
}
ADMIN="gitea-admin:$GITEA_ADMIN_PASSWORD"

say "Comptes Gitea : gitea-admin, alice (développeuse), bob (PO et relecteur)"
for u in gitea-admin alice bob; do
  case $u in
    gitea-admin) p=$GITEA_ADMIN_PASSWORD; extra=--admin ;;
    alice) p=$ALICE_PASSWORD; extra= ;;
    bob) p=$BOB_PASSWORD; extra= ;;
  esac
  if curl -fs "$G/api/v1/users/$u" >/dev/null 2>&1; then
    echo "$u existe déjà"
  else
    gitea admin user create $extra --username "$u" --password "$p" \
      --email "$u@rhpilot.test" --must-change-password=false >/dev/null
    echo "$u créé"
  fi
done

say "Organisation rhpilot, équipe devs, dépôt rhpilot/rhpilot"
api "$ADMIN" GET /orgs/rhpilot >/dev/null 2>&1 || \
  api "$ADMIN" POST /orgs '{"username":"rhpilot","full_name":"RHPilot","visibility":"public"}' >/dev/null
TEAM=$(api "$ADMIN" GET /orgs/rhpilot/teams | sed -n 's/.*"id":\([0-9]*\),"name":"devs".*/\1/p')
if [ -z "$TEAM" ]; then
  TEAM=$(api "$ADMIN" POST /orgs/rhpilot/teams '{"name":"devs","permission":"write","includes_all_repositories":true,"units":["repo.code","repo.issues","repo.pulls","repo.releases","repo.wiki","repo.actions","repo.projects"]}' \
    | sed -n 's/^{"id":\([0-9]*\).*/\1/p')
fi
api "$ADMIN" PUT "/teams/$TEAM/members/alice" >/dev/null
api "$ADMIN" PUT "/teams/$TEAM/members/bob" >/dev/null

api "$ADMIN" GET "/repos/$REPO" >/dev/null 2>&1 || \
  api "$ADMIN" POST /orgs/rhpilot/repos '{"name":"rhpilot","description":"Module candidatures de RHPilot","default_branch":"main","private":false}' >/dev/null
if ! api "$ADMIN" GET "/repos/$REPO/branches/main" >/dev/null 2>&1; then
  T=$(mktemp -d)
  cp -R ../app/. "$T"
  rm -rf "$T/node_modules"
  (
    cd "$T"
    git init -q -b main
    git -c user.name="Équipe RHPilot" -c user.email="dev@rhpilot.test" add -A
    git -c user.name="Équipe RHPilot" -c user.email="dev@rhpilot.test" commit -qm "Module candidatures, version 1.0.0"
    # credential.helper vide : le mot de passe ne part pas dans le trousseau du système
    git -c credential.helper= push -q "http://alice:$ALICE_PASSWORD@localhost:3300/$REPO.git" main
  )
  rm -rf "$T"
  echo "code de l'application poussé sur main"
else
  echo "le code est déjà sur main"
fi

# alice administre le dépôt : elle règle ses protections de branche.
api "$ADMIN" PUT "/repos/$REPO/collaborators/alice" '{"permission":"admin"}' >/dev/null

say "Labels : statuts (exclusifs), types, agent"
EXISTING=$(api "$ADMIN" GET "/repos/$REPO/labels?limit=50")
label() { # nom couleur exclusif description
  echo "$EXISTING" | grep -q "\"name\":\"$1\"" && return 0
  api "$ADMIN" POST "/repos/$REPO/labels" \
    "{\"name\":\"$1\",\"color\":\"$2\",\"exclusive\":$3,\"description\":\"$4\"}" >/dev/null
  echo "label $1"
}
label status/backlog '#c5c5c5' true "Pas encore prêt : à préciser"
label status/ready '#1d76db' true "Prêt : spécifié, peut être pris"
label status/doing '#fbca04' true "En cours"
label status/review '#d93f0b' true "En relecture"
label status/done '#0e8a16' true "Terminé, fusionné"
label type/bug '#b60205' false "Défaut"
label type/feature '#5319e7' false "Nouvelle fonction"
label type/debt '#795548' false "Dette technique"
label agent '#006b75' false "Travail confié à un agent de code"

say "Issue du client, ouverte par bob"
if api "$ADMIN" GET "/repos/$REPO/issues?state=all&type=issues" | grep -q "droit à l'effacement"; then
  echo "l'issue existe déjà"
else
  L=$(api "$ADMIN" GET "/repos/$REPO/labels?limit=50" | tr '{' '\n' | grep -E '^"id":[0-9]+,"name":"(status/backlog|type/feature)"' | sed 's/^"id":\([0-9]*\).*/\1/' | paste -sd, -)
  api "bob:$BOB_PASSWORD" POST "/repos/$REPO/issues" "{\"title\":\"Le client veut le droit à l'effacement\",\"body\":\"Mail de la DPO du client : « Un candidat nous a demandé de supprimer ses données. Il faut pouvoir le faire dans RHPilot. » Je n'en sais pas plus. Bob\",\"labels\":[$L]}" >/dev/null
  echo "issue créée"
fi

say "SonarQube : mot de passe, projet rhpilot, jeton d'analyse"
printf 'Attente de SonarQube (une à deux minutes au premier démarrage)'
until curl -fs "$S/api/system/status" 2>/dev/null | grep -q '"status":"UP"'; do printf '.'; sleep 3; done; echo
SA="admin:$SONAR_PASSWORD"
if ! curl -fs -u "$SA" "$S/api/authentication/validate" | grep -q '"valid":true'; then
  curl -fsS -u admin:admin -X POST "$S/api/users/change_password" \
    --data-urlencode login=admin --data-urlencode previousPassword=admin \
    --data-urlencode "password=$SONAR_PASSWORD"
  echo "mot de passe admin changé"
fi
curl -fs -u "$SA" "$S/api/projects/search?projects=rhpilot" | grep -q '"key":"rhpilot"' || {
  curl -fsS -u "$SA" -X POST "$S/api/projects/create" -d project=rhpilot -d name=RHPilot -d mainBranch=develop >/dev/null
  echo "projet rhpilot créé"
}
curl -fsS -u "$SA" -X POST "$S/api/user_tokens/revoke" -d name=rhpilot-ci >/dev/null 2>&1 || true
SONAR_TOKEN=$(curl -fsS -u "$SA" -X POST "$S/api/user_tokens/generate" -d name=rhpilot-ci \
  -d type=PROJECT_ANALYSIS_TOKEN -d projectKey=rhpilot | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
grep -v '^SONAR_TOKEN=' .env > .env.tmp && mv .env.tmp .env
echo "SONAR_TOKEN=$SONAR_TOKEN" >> .env
echo "jeton d'analyse rhpilot-ci enregistré dans .env"

say "Pipeline : secret SONAR_TOKEN et variable SONAR_HOST_URL du dépôt"
api "$ADMIN" PUT "/repos/$REPO/actions/secrets/SONAR_TOKEN" "{\"data\":\"$SONAR_TOKEN\"}" >/dev/null
api "$ADMIN" POST "/repos/$REPO/actions/variables/SONAR_HOST_URL" '{"value":"http://sonarqube:9000"}' >/dev/null 2>&1 || \
  api "$ADMIN" PUT "/repos/$REPO/actions/variables/SONAR_HOST_URL" '{"value":"http://sonarqube:9000"}' >/dev/null

say "Runner Gitea Actions"
if [ "$(docker compose ps -q runner 2>/dev/null)" ]; then
  echo "le runner tourne déjà"
else
  RUNNER_TOKEN=$(gitea actions generate-runner-token | tail -1 | tr -d '\r')
  RUNNER_TOKEN=$RUNNER_TOKEN docker compose --profile runner up -d runner
fi

say "Prêt"
cat <<EOF
Gitea      $G   alice / $ALICE_PASSWORD   (bob / $BOB_PASSWORD dans une fenêtre privée)
SonarQube  $S   admin / $SONAR_PASSWORD
RHPilot    http://localhost:8300
Les mots de passe restent dans kit/infra/.env.
EOF
