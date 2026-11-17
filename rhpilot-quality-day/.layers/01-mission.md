---
title: "01 - La mission et l'environnement"
description: "Ce que demande le client, puis l'installation du kit : la forge Gitea, son runner, SonarQube et l'application RHPilot"
---

Avant de toucher au code, on fixe ce qu'on cherche à obtenir, puis on installe l'environnement de la journée. Cette étape est un **support** : toutes ses commandes sont fournies.

## 01.1 - Ce que demande le client

Le client est un groupe de distribution qui recrute plusieurs milliers de personnes par an. Son service achats envoie deux exigences :

| Exigence | Ce qu'elle veut dire pour le code |
|---|---|
| RHPilot certifiée **ISO 27001** | un système de management de la sécurité : l'auditeur regarde comment le code est produit, relu, testé, et comment les failles connues sont traitées (annexe A, mesures de développement sécurisé) |
| contrat de sous-traitance **RGPD** (article 28) | RHPilot traite des données personnelles de candidats pour le compte du client : elle doit les protéger, et permettre au client de répondre aux droits des personnes, dont le **droit à l'effacement** (article 17) |

Le module concerné est le module **candidatures** : un candidat postule à une offre, un recruteur recherche et exporte les candidatures. C'est une petite application Node.js : un serveur Express, une base PostgreSQL, une page web sans framework.

> 💡 Ces obligations sont présentées dans le bit [Six entreprises, six cadres de qualité](https://byte-layers.com/fr/bits/quality-obligations-by-company), où RHPilot apparaît déjà.

## 01.2 - Récupérer le kit

Le kit contient l'application de départ, l'environnement Docker et les fichiers fournis à certaines étapes. Clonez-le :

```exec
git clone --depth 1 --branch rhpilot-quality-day/v3 https://github.com/byte-layers/courses-quality-day.git ~/byte-layers/quality-day/course
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `--depth 1` | ne télécharge que la dernière version, sans l'historique |
> | `--branch rhpilot-quality-day/v3` | prend la version du kit qui correspond à ce lab |
> | `~/byte-layers/quality-day/course` | le dossier où ranger le kit |

```verify
[ -f ~/byte-layers/quality-day/course/kit/infra/init.sh ] || { echo "Le kit n'est pas dans ~/byte-layers/quality-day/course : relancez la commande git clone."; exit 1; }
echo "Le kit est en place."
```

## 01.3 - Démarrer l'environnement

**Sous Linux seulement**, SonarQube embarque un moteur de recherche qui exige un réglage du noyau. Docker Desktop le fait déjà sous macOS et Windows :

```bash
sudo sysctl -w vm.max_map_count=524288
```

Ce réglage est perdu au redémarrage. Pour le garder, écrivez la ligne `vm.max_map_count=524288` dans un fichier de `/etc/sysctl.d/`, par exemple `/etc/sysctl.d/99-sonarqube.conf`.

Le script `init.sh` démarre cinq conteneurs et les relie entre eux :

| Service | Adresse | Rôle |
|---|---|---|
| **Gitea** | http://localhost:3300 | la forge : dépôt, issues, pull requests, et **Gitea Actions**, son moteur de pipelines, proche de GitHub Actions |
| runner | — | le programme qui exécute les jobs des pipelines, dans des conteneurs Docker |
| **SonarQube** | http://localhost:9300 | l'analyse de code : dette technique, failles, couverture, quality gate |
| PostgreSQL | port 5433 | la base de l'application, et deux bases vides pour les tests |
| **RHPilot** | http://localhost:8300 | l'application telle qu'elle tourne aujourd'hui chez les clients |

Il crée aussi les comptes, le dépôt `rhpilot/rhpilot`, ses labels, une issue du client, le projet SonarQube et son jeton. Le premier lancement télécharge plusieurs images : comptez cinq à dix minutes.

```exec
sh ~/byte-layers/quality-day/course/kit/infra/init.sh
```

Quand tout est prêt, le script affiche les adresses et les comptes :

```text
== Prêt
Gitea      http://localhost:3300   alice / …   (bob / … dans une fenêtre privée)
SonarQube  http://localhost:9300   admin / …
RHPilot    http://localhost:8300
Les mots de passe restent dans kit/infra/.env.
```

Les mots de passe sont générés au hasard pour votre poste et rangés dans `~/byte-layers/quality-day/course/kit/infra/.env`. Vous pouvez relancer le script sans risque : il garde ce qui existe déjà. Pour afficher les mots de passe d'alice, de bob et de l'administrateur SonarQube quand vous en aurez besoin :

```exec
grep -E '^(ALICE|BOB|SONAR)_PASSWORD=' ~/byte-layers/quality-day/course/kit/infra/.env
```

```verify
curl -fs http://localhost:3300/api/v1/version >/dev/null || { echo "Gitea ne répond pas sur le port 3300. Relancez init.sh et lisez son message d'erreur."; exit 1; }
curl -fs http://localhost:9300/api/system/status | grep -q '"status":"UP"' || { echo "SonarQube n'est pas prêt sur le port 9300. Attendez une minute, puis vérifiez de nouveau."; exit 1; }
N=$(curl -fs http://localhost:8300/api/offers | grep -o '"id"' | wc -l | tr -d ' ')
[ "$N" = "4" ] || { echo "RHPilot ne renvoie pas ses 4 offres sur le port 8300. Regardez docker compose logs app dans le dossier kit/infra."; exit 1; }
echo "Gitea, SonarQube et RHPilot répondent."
```

## 01.4 - Le tour du propriétaire

Ouvrez http://localhost:8300 : à gauche, le formulaire de candidature ; à droite, l'espace recruteur, protégé par un jeton. Le jeton actuel est `rhp_live_8f3a2c9d1e7b4a60` ; tapez-le, puis cliquez **Rechercher** : la liste des candidatures s'affiche.

Ouvrez ensuite http://localhost:3300 et connectez-vous avec le compte **alice**, la développeuse que vous jouez toute la journée. Dans une **fenêtre de navigation privée**, connectez-vous avec le compte **bob** : c'est le product owner, qui joue aussi le relecteur des pull requests. Les deux fenêtres permettent d'être deux personnes sans se déconnecter.

Avec bob, ouvrez le dépôt `rhpilot/rhpilot`, puis l'onglet **Issues** : bob a déjà ouvert une issue, « Le client veut le droit à l'effacement ». Elle est vague, et c'est normal : vous la traiterez à l'étape 08.

```acknowledge
J'ai essayé l'application, et je suis connecté à Gitea avec alice et avec bob.
```

## 01.5 - Cloner le dépôt

Clonez le dépôt de l'application dans votre dossier de travail. Git vous demande un identifiant : `alice`, et le mot de passe d'alice affiché par `init.sh`.

```exec
git clone http://localhost:3300/rhpilot/rhpilot.git ~/byte-layers/quality-day/rhpilot
```

Vos commits doivent porter le nom d'alice, pour que Gitea les relie à son compte. Ces réglages ne valent que pour ce dépôt :

```exec
cd ~/byte-layers/quality-day/rhpilot && git config user.name alice && git config user.email alice@rhpilot.test
```

Ouvrez le dossier `~/byte-layers/quality-day/rhpilot` dans VS Code, et parcourez-le :

| Dossier | Contenu |
|---|---|
| `src/` | le serveur : `server.js`, l'authentification des recruteurs, les routes `offers` et `applications` |
| `public/` | la page web et son script |
| `db/` | le schéma de la base et le script qui la remplit de candidatures fictives |
| `test/` | les tests unitaires |
| `e2e/` | une ancienne tentative de test de bout en bout avec Playwright |
| `.gitea/workflows/` | le pipeline Gitea Actions |

```verify
D=~/byte-layers/quality-day/rhpilot
[ -d "$D/.git" ] || { echo "Le dépôt n'est pas cloné dans $D : relancez la commande git clone."; exit 1; }
[ "$(git -C "$D" config user.name)" = "alice" ] || { echo "Le nom des commits n'est pas alice : lancez la commande git config de la section 01.5."; exit 1; }
echo "Le dépôt est cloné, et vos commits porteront le nom d'alice."
```
