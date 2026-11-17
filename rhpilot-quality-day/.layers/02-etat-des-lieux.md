---
title: "02 - L'état des lieux"
description: "Lire le pipeline existant, analyser le code avec SonarQube, régler son profil, auditer les dépendances, chercher ce que les outils ne voient pas, et fixer une quality gate"
---

L'auditeur a dit « trop de dette ». Avant de décider quoi que ce soit, il faut savoir **combien**, et **où**. Dans cette étape, vous mesurez avec deux outils, vous constatez leurs limites, et vous écrivez la règle qui dira quand le module est prêt pour l'audit.

## 02.1 - Le pipeline existant

Dans Gitea, ouvrez le dépôt `rhpilot/rhpilot`, puis l'onglet **Actions** : un pipeline a tourné quand `init.sh` a poussé le code, et il est vert. Ouvrez maintenant `.gitea/workflows/ci.yml` dans VS Code :

```yaml
name: CI
on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest
    container: node:24-bookworm-slim
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

Le format est celui de GitHub Actions : un job `tests` qui récupère le code, installe les dépendances et lance les tests. Vert, donc. Ouvrez ensuite `test/utils.test.js` et `e2e/apply.spec.js`, puis répondez pour vous-même : que vérifie vraiment ce pipeline ?

```solution
Presque rien. Il y a trois tests unitaires sur de petites fonctions, dont un désactivé (`test.skip`, « flaky, à corriger plus tard »). Aucune route de l'API n'est testée. Le test Playwright de `e2e/` n'est lancé nulle part, et il ne pourrait pas tourner : il est écrit en CommonJS dans un projet en modules ES, il vise des éléments qui n'existent pas (`#submit-btn`, `.success`), et `playwright.config.js` est cassé de la même façon. Un pipeline vert qui ne teste rien rassure à tort.
```

Gardez cette réponse en tête : c'est le premier constat de l'état des lieux.

```acknowledge
J'ai lu le pipeline et les tests, et je sais ce qu'ils vérifient.
```

## 02.2 - Une première analyse SonarQube

SonarQube analyse le code sans l'exécuter : c'est de l'**analyse statique**. Le programme qui lit le code et envoie le résultat au serveur s'appelle le **scanner**. On le lance ici dans un conteneur Node.js, relié au réseau du kit pour joindre le serveur :

```exec
cd ~/byte-layers/quality-day/rhpilot && MSYS_NO_PATHCONV=1 docker run --rm --network rhpilot-lab -v "$PWD":/src -w /src node:24-bookworm-slim npx -y @sonar/scan@5.1.0 -Dsonar.host.url=http://sonarqube:9000 -Dsonar.projectKey=rhpilot -Dsonar.token="$(sed -n 's/^SONAR_TOKEN=//p' ~/byte-layers/quality-day/course/kit/infra/.env)"
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `MSYS_NO_PATHCONV=1` | sous Git Bash, empêche Windows de transformer `/src` en chemin Windows ; sans effet ailleurs |
> | `docker run --rm` | lance un conteneur, supprimé à la fin |
> | `--network rhpilot-lab` | le relie au réseau du kit : il joint le serveur par son nom, `sonarqube` |
> | `-v "$PWD":/src -w /src` | monte le dossier courant, votre dépôt, dans `/src`, et s'y place |
> | `npx -y @sonar/scan@5.1.0` | télécharge et lance le scanner SonarQube pour JavaScript, en version figée |
> | `-Dsonar.host.url=…`, `-Dsonar.projectKey=rhpilot` | le serveur, et le projet que `init.sh` a créé |
> | `"$(sed -n 's/^SONAR_TOKEN=//p' …/.env)"` | lit le jeton d'analyse dans `.env`, sans l'afficher |

Le scanner se termine par `ANALYSIS SUCCESSFUL` ou `SonarScanner Engine completed successfully`. Il a laissé un dossier `.scannerwork`, que `.gitignore` ignore déjà.

Connectez-vous à http://localhost:9300 avec `admin` et le mot de passe de SonarQube affiché par `init.sh`, puis ouvrez le projet **RHPilot** :

| Indicateur | Valeur | Ce qu'elle veut dire |
|---|---|---|
| **Security** | E, 2 problèmes | des mots de passe PostgreSQL écrits dans le code |
| **Reliability** | C, 1 problème | une promesse dont l'erreur n'est jamais traitée, dans `public/app.js` |
| **Maintainability** | A, 0 problème, dette 0 min | aucune mauvaise pratique ?! |
| **Duplications** | 7 % | du code copié |

Une dette de **zéro minute**, sur ce code-là. Ouvrez `src/routes/applications.js` : une fonction de soixante lignes, des `if` imbriqués sur six niveaux, une validation copiée deux fois. Quelque chose cloche dans le réglage.

## 02.3 - Régler le profil de règles

SonarQube applique à chaque langage un **profil** : la liste des règles actives. Dans cette version, le profil JavaScript par défaut s'appelle **Sonar way core** : 200 règles, centrées sur les bugs et la sécurité, sans règle de complexité. D'autres profils sont livrés :

| Profil | Règles | Pour quoi |
|---|---|---|
| Sonar way core | 200 | le minimum, par défaut |
| Sonar way extended | 252 | ajoute la complexité cognitive |
| **Sonar way comprehensive** | 425 | ajoute la plupart des règles de maintenabilité : `TODO`, imbrication, boucles |
| Sonar agentic AI | 364 | conçu pour relire du code produit par des agents |

> 📖 [SonarQube, profils de qualité (en anglais)](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-profiles/introduction)

Choisissez le profil complet pour le projet. Dans SonarQube, ouvrez le projet **RHPilot**, puis **Project Settings**, **Quality Profiles**. Sur la ligne JavaScript, choisissez **Sonar way comprehensive**, puis enregistrez.

Relancez ensuite l'analyse : la commande est la même qu'en 02.2. Le projet affiche maintenant une quinzaine de problèmes de maintenabilité, dont une **complexité cognitive de 56** pour la fonction de recherche, alors que la règle en tolère 15, et les `TODO` laissés dans le code. La dette passe d'environ zéro à un peu plus d'une heure et demie.

> ⚖️ **Un outil mal réglé rassure à tort.** Le même code donnait « A, 0 minute » il y a deux minutes. Avant de croire un indicateur, vérifiez ce qu'il mesure.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
SA="admin:$(sed -n 's/^SONAR_PASSWORD=//p' "$E")"
P=$(curl -fs -u "$SA" "http://localhost:9300/api/qualityprofiles/search?project=rhpilot&language=js" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -1)
[ "$P" = "Sonar way comprehensive" ] || { echo "Le profil JavaScript du projet est « $P » : choisissez Sonar way comprehensive dans Project Settings, Quality Profiles."; exit 1; }
N=$(curl -fs -u "$SA" "http://localhost:9300/api/measures/component?component=rhpilot&metricKeys=code_smells" | sed -n 's/.*"value":"\([0-9]*\)".*/\1/p')
[ "${N:-0}" -ge 10 ] || { echo "La dernière analyse compte ${N:-0} problèmes de maintenabilité : relancez l'analyse de la section 02.2 après avoir changé de profil."; exit 1; }
echo "Profil Sonar way comprehensive, et $N problèmes de maintenabilité mesurés."
```

## 02.4 - Les dépendances

SonarQube Community ne regarde que votre code. Les failles connues des **bibliothèques** que vous utilisez relèvent d'une autre analyse, la **SCA** (*Software Composition Analysis*). La plus simple est livrée avec npm :

```exec
cd ~/byte-layers/quality-day/rhpilot && npm audit --omit=dev
```

`--omit=dev` limite l'audit aux dépendances qui partent en production. Le rapport signale **lodash 4.17.20**, avec plusieurs failles de niveau `high`, et propose la version 4.18.1. La commande se termine en erreur : c'est ainsi que `npm audit` signale qu'il a trouvé des failles. Vous l'appliquerez à l'étape 05.

> 💡 `npm audit` suffit pour ce lab. En entreprise, on le complète souvent par Trivy ou OWASP Dependency-Check, qui analysent aussi les images, par Dependabot ou Renovate, qui proposent les mises à jour, ou par Snyk.

## 02.5 - Ce que les outils n'ont pas vu

Les outils ont trouvé des mots de passe, de la complexité, une bibliothèque vulnérable. Lisez maintenant vous-même `src/routes/applications.js`, `src/auth.js` et `public/app.js`, comme le ferait un auditeur. Une démonstration d'abord : la recherche du recruteur, avec un nom qui n'existe pas, puis avec un texte un peu particulier.

```exec
curl -s -H 'x-recruiter-token: rhp_live_8f3a2c9d1e7b4a60' "http://localhost:8300/api/applications?q=Zzz" | grep -o '"id"' | wc -l
curl -s -H 'x-recruiter-token: rhp_live_8f3a2c9d1e7b4a60' "http://localhost:8300/api/applications?q=%27%20OR%201%3D1%20--" | grep -o '"id"' | wc -l
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `-H 'x-recruiter-token: …'` | envoie le jeton recruteur dans un en-tête HTTP |
> | `q=%27%20OR%201%3D1%20--` | le texte `' OR 1=1 --`, écrit avec les codes d'une adresse web |
> | `grep -o '"id"' \| wc -l` | compte les candidatures de la réponse |

La première recherche renvoie `0`, la seconde renvoie **toutes** les candidatures. Le texte tapé dans la recherche est collé dans la requête SQL, qui devient `… ILIKE '%' OR 1=1 --%'` : c'est une **injection SQL**. SonarQube Community ne l'a pas signalée, et aucun outil gratuit ne l'aurait fait : il faudrait suivre la valeur depuis la requête HTTP jusqu'à la base, ce que fait l'analyse de flux des éditions payantes.

**À vous** : trouvez dans quel fichier se cache chacun de ces quatre problèmes, et écrivez vos réponses dans un nouveau fichier texte, `~/byte-layers/quality-day/constats.txt` (créez-le avec VS Code ou tout autre éditeur), une ligne par problème, au format `clé=chemin/du/fichier` :

| Clé | Problème |
|---|---|
| `injection` | la requête SQL construite avec le texte de la recherche |
| `xss` | du HTML construit avec le nom du candidat : un nom qui contient une balise `<script>` serait exécuté chez le recruteur |
| `logs` | l'email et le téléphone des candidats écrits dans le journal du serveur |
| `jeton` | le jeton recruteur accepté dans l'adresse de la page, donc gardé dans l'historique du navigateur et les journaux |

```hint
Les quatre problèmes sont dans trois fichiers différents. Cherchez `innerHTML`, `console.log` et `req.query`.
```

````solution
```text
injection=src/routes/applications.js
xss=public/app.js
logs=src/routes/applications.js
jeton=src/auth.js
```
````

```verify
F=~/byte-layers/quality-day/constats.txt
[ -f "$F" ] || { echo "Le fichier $F n'existe pas : créez-le avec une ligne par problème."; exit 1; }
v() { tr -d '\r ' < "$F" | sed -n "s/^$1=//p" | tail -1 | sed 's#^\./##'; }
for k in injection xss logs jeton; do [ -n "$(v $k)" ] || { echo "Il manque la ligne $k=… dans $F."; exit 1; }; done
[ "$(v injection)" = "src/routes/applications.js" ] || { echo "injection : ce n'est pas ce fichier. Cherchez la requête SQL qui utilise req.query.q."; exit 1; }
[ "$(v xss)" = "public/app.js" ] || { echo "xss : ce n'est pas ce fichier. Cherchez où le HTML de la liste est construit."; exit 1; }
[ "$(v logs)" = "src/routes/applications.js" ] || { echo "logs : ce n'est pas ce fichier. Cherchez les console.log qui écrivent un email."; exit 1; }
[ "$(v jeton)" = "src/auth.js" ] || { echo "jeton : ce n'est pas ce fichier. Cherchez où le jeton est lu dans la requête."; exit 1; }
echo "Les quatre constats sont localisés."
```

Rangeons maintenant tout ce que l'état des lieux a trouvé, par caractéristique de qualité du [modèle ISO/IEC 25010](https://byte-layers.com/fr/bits/iso-25010-quality-model), et par obligation du client :

| Constat | Trouvé par | ISO 25010 | Obligation |
|---|---|---|---|
| injection SQL, XSS, jeton dans l'adresse | vous | sécurité | ISO 27001, développement sécurisé |
| mots de passe dans le code | SonarQube | sécurité | ISO 27001, gestion des secrets |
| lodash vulnérable | npm audit | sécurité | ISO 27001, vulnérabilités techniques |
| emails et téléphones dans les journaux | vous | sécurité (confidentialité) | RGPD, minimisation et sécurité |
| aucune suppression possible | vous, avec le contrat | adéquation fonctionnelle | RGPD, droit à l'effacement |
| fonction de complexité 56, code copié | SonarQube | maintenabilité | ISO 27001, maîtrise des changements |
| presque aucun test | vous | maintenabilité (testabilité) | ISO 27001, tests de sécurité et de recette |

## 02.6 - La règle de sortie : une quality gate

Une **quality gate** est une liste de conditions qu'une analyse doit remplir pour être déclarée réussie. Celle livrée par défaut, *Sonar way*, ne regarde que le **nouveau code** : sur un projet qui commence son analyse, elle ne dit presque rien de la dette existante. L'auditeur, lui, regarde tout le code. On écrit donc une gate qui porte sur l'ensemble du code.

Dans SonarQube, ouvrez **Quality Gates**, cliquez **Create**, et nommez-la `RHPilot audit`. Elle démarre avec les conditions de *Sonar way* sur le nouveau code : gardez-les. Ajoutez ensuite, avec **Add Condition**, en choisissant **On Overall Code**, ces quatre conditions :

| Indicateur | Condition |
|---|---|
| Security Rating | moins bonne que A |
| Reliability Rating | moins bonne que A |
| Coverage | inférieure à 80 % |
| Duplicated Lines (%) | supérieure à 3 % |

> 📖 [SonarQube, quality gates (en anglais)](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates)

Associez enfin la gate au projet : dans le projet **RHPilot**, **Project Settings**, **Quality Gate**, choisissez **RHPilot audit**. Relancez l'analyse de la section 02.2 : la gate est **Failed**, sur la sécurité, la fiabilité, la couverture et la duplication. C'est votre objectif de la journée : la faire passer au vert sans tricher sur les conditions.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
SA="admin:$(sed -n 's/^SONAR_PASSWORD=//p' "$E")"
G=$(curl -fs -u "$SA" "http://localhost:9300/api/qualitygates/get_by_project?project=rhpilot" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')
[ "$G" = "RHPilot audit" ] || { echo "Le projet utilise la gate « $G » : associez-lui RHPilot audit dans Project Settings, Quality Gate."; exit 1; }
C=$(curl -fs -u "$SA" "http://localhost:9300/api/qualitygates/show?name=RHPilot%20audit")
for m in security_rating reliability_rating coverage duplicated_lines_density; do
  echo "$C" | grep -qE "\"metric\":\"(software_quality_)?$m\"" || { echo "La gate n'a pas de condition sur $m (On Overall Code)."; exit 1; }
done
S=$(curl -fs -u "$SA" "http://localhost:9300/api/qualitygates/project_status?projectKey=rhpilot" | sed -n 's/^{"projectStatus":{"status":"\([A-Z]*\)".*/\1/p')
[ "$S" = "ERROR" ] || { echo "La dernière analyse n'est pas en échec (« $S ») : relancez l'analyse de la section 02.2 après avoir associé la gate."; exit 1; }
echo "La gate RHPilot audit est en place, et le code actuel ne la passe pas."
```
