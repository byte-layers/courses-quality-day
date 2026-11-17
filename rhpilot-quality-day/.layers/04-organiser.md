---
title: "04 - Organiser le travail"
description: "Adopter gitflow, protéger les branches avec un pipeline et une relecture obligatoires, suivre les issues avec des labels de statut, et écrire la Definition of Done"
---

Avant de laisser quiconque, humain ou agent, modifier le code, on fixe **comment** une modification arrive dans le produit. C'est l'étage « relecture humaine » de la pyramide, mais cadré par la forge : personne ne pourra le contourner, même par oubli.

## 04.1 - Choisir un workflow Git

Un **workflow Git** dit quelles branches existent et comment le code passe de l'une à l'autre. Trois modèles reviennent souvent :

| Modèle | Branches | Pour qui |
|---|---|---|
| **gitflow** | `main` (ce qui est en production), `develop` (la prochaine version), `feature/*`, `release/*`, `hotfix/*` | un produit livré par versions, avec une recette avant chaque mise en production |
| **GitHub flow** | `main` et des branches courtes, fusionnées par pull request | une application déployée dès qu'une modification est fusionnée |
| **trunk-based** | presque tout le monde sur `main`, des branches de quelques heures au plus, des fonctions cachées derrière des interrupteurs (*feature flags*) | une équipe très outillée, avec des tests rapides et fiables |

RHPilot livre des versions à ses clients, qui les recettent : on choisit **gitflow**. Il est plus lourd que les deux autres, et beaucoup d'équipes passent au trunk-based quand leurs tests deviennent assez fiables. Pour ce lab, il a un avantage : il rend visibles toutes les étapes d'une modification.

Créez la branche `develop` à partir de `main`, et publiez-la :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch -c develop && git push -u origin develop
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `git switch -c develop` | crée la branche `develop` à partir de la branche courante, `main`, et s'y place |
> | `git push -u origin develop` | publie la branche sur Gitea ; `-u` relie la branche locale à celle de Gitea, pour que les prochains `git push` et `git pull` sachent où aller |

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
curl -fs -u "$U" http://localhost:3300/api/v1/repos/rhpilot/rhpilot/branches/develop >/dev/null || { echo "La branche develop n'existe pas sur Gitea : relancez la commande git push de la section 04.1."; exit 1; }
echo "La branche develop est publiée."
```

## 04.2 - Protéger develop et main

Une **protection de branche** fixe ce qu'il faut pour qu'une modification entre dans une branche. Sur `develop` et `main`, on exige trois choses : passer par une pull request, un pipeline vert, et l'accord d'un relecteur.

Dans Gitea, avec alice, ouvrez le dépôt, puis **Settings**, **Branches**, et cliquez **Add New Rule**. Remplissez :

| Champ | Valeur | Pourquoi |
|---|---|---|
| **Protected Branch Name Pattern** | `develop` | la branche protégée |
| **Push** | **Disable Push** | plus personne ne pousse directement : tout passe par une pull request |
| **Enable Status Check** | coché, avec le motif `CI / checks (pull_request)` | le job `checks` du pipeline doit être vert sur la pull request ; le nom vient du pipeline (`CI`), du job, et de l'événement |
| **Required approvals** | `1` | un relecteur doit approuver ; bob peut le faire, car `init.sh` l'a placé avec alice dans l'équipe `devs`, qui a le droit d'écriture |
| **Block merge on rejected reviews** | coché | un relecteur qui demande des changements bloque la fusion |
| **Dismiss stale approvals** | coché | une approbation tombe si le code change après coup |
| **Block admin merge override** | coché | alice administre le dépôt : sans cette case, elle pourrait fusionner sans pipeline vert ni approbation |

> 📖 [Gitea, protection des branches (en anglais)](https://docs.gitea.com/usage/access-control/protected-branches) · [Gitea Actions (en anglais)](https://docs.gitea.com/usage/actions/overview)

Enregistrez avec **Save Rule**, puis créez la même règle pour `main`.

Le job `checks` n'existe pas encore : vous l'écrirez à l'étape 05. D'ici là, aucune pull request ne pourra être fusionnée, ce qui est voulu. Avec la dernière case, les règles s'appliquent à tout le monde, alice comprise.

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
for b in develop main; do
  R=$(curl -fs -u "$U" "http://localhost:3300/api/v1/repos/rhpilot/rhpilot/branch_protections/$b") || { echo "La branche $b n'a pas de règle de protection : créez-la dans Settings, Branches."; exit 1; }
  echo "$R" | grep -q '"enable_push":false' || { echo "La règle de $b autorise encore le push direct : choisissez Disable Push."; exit 1; }
  echo "$R" | grep -q '"enable_status_check":true' || { echo "La règle de $b n'exige pas de pipeline vert : cochez Enable Status Check."; exit 1; }
  echo "$R" | grep -q 'CI / checks (pull_request)' || { echo "La règle de $b n'attend pas le statut CI / checks (pull_request) : ajoutez ce motif."; exit 1; }
  echo "$R" | grep -qE '"required_approvals":[1-9]' || { echo "La règle de $b n'exige aucune approbation : mettez Required approvals à 1."; exit 1; }
  echo "$R" | grep -q '"block_admin_merge_override":true' || { echo "La règle de $b laisse les administrateurs passer outre : cochez Block admin merge override."; exit 1; }
done
echo "develop et main sont protégées."
```

## 04.3 - Des labels pour les statuts

Gitea n'a pas de tableau de suivi avec des colonnes de statut comme Jira. On s'en passe avec des **labels exclusifs** : `init.sh` a créé `status/backlog`, `status/ready`, `status/doing`, `status/review` et `status/done`. Ils sont exclusifs : ajouter `status/doing` à une issue retire le statut précédent, si bien qu'une issue n'a jamais deux statuts à la fois.

| Statut | Veut dire |
|---|---|
| `status/backlog` | noté, pas encore assez précis pour être pris |
| `status/ready` | précisé, prêt à être pris |
| `status/doing` | quelqu'un, humain ou agent, travaille dessus |
| `status/review` | une pull request attend sa relecture |
| `status/done` | fusionné |

Les labels `type/bug`, `type/feature` et `type/debt` disent la nature du travail, et `agent` marque une issue confiée à un agent de code.

Avec alice, ouvrez **Issues**, puis **New Issue**, et créez deux issues tirées de l'état des lieux. Donnez-leur à chacune les labels `type/debt` et `status/ready`, avec le bouton **Labels** à droite :

| Titre | Description |
|---|---|
| `Poser les garde-fous` | Lint, tests de l'API, couverture, audit des dépendances et SonarQube dans le pipeline, avant tout remaniement. |
| `Remanier le module candidatures` | Corriger les constats de l'audit : injection SQL, XSS, données personnelles dans les journaux, jeton dans l'adresse, secrets, complexité, code copié. |

```verify
E=~/byte-layers/quality-day/course/kit/infra/.env
U="alice:$(sed -n 's/^ALICE_PASSWORD=//p' "$E")"
J=$(curl -fs -u "$U" "http://localhost:3300/api/v1/repos/rhpilot/rhpilot/issues?state=all&type=issues&labels=type/debt&limit=50")
N=$(echo "$J" | grep -o '"number":' | wc -l | tr -d ' ')
[ "$N" -ge 2 ] || { echo "Il y a $N issue(s) avec le label type/debt : il en faut deux, Poser les garde-fous et Remanier le module candidatures."; exit 1; }
echo "$J" | grep -q 'Poser les garde-fous' || { echo "L'issue « Poser les garde-fous » est introuvable : vérifiez son titre."; exit 1; }
echo "$J" | grep -q 'Remanier le module candidatures' || { echo "L'issue « Remanier le module candidatures » est introuvable : vérifiez son titre."; exit 1; }
echo "Les deux issues de dette sont créées."
```

## 04.4 - La Definition of Done

La **Definition of Done** est la liste de ce qui doit être vrai pour qu'un travail soit fini. Une partie est déjà vérifiée par la forge (pipeline vert, une approbation) ; le reste se coche à la main. On la met dans le **modèle de pull request**, un fichier dont Gitea pré-remplit chaque nouvelle pull request. Gitea le lit sur la branche par défaut, `main` : le vôtre n'y arrivera qu'avec la première version, à l'étape 08. D'ici là, vous copierez son contenu dans la description de chaque pull request.

Placez-vous sur une branche pour le premier chantier, celui de l'issue « Poser les garde-fous », puis créez le modèle :

```exec
cd ~/byte-layers/quality-day/rhpilot && git switch -c feature/guardrails develop && mkdir -p .gitea && cat > .gitea/pull_request_template.md <<'FIN'
## Ce que change cette pull request

Issue :

## Definition of Done

- [ ] Le pipeline est vert (vérifié par la forge).
- [ ] Un relecteur a approuvé (vérifié par la forge).
- [ ] Les tests couvrent le nouveau comportement, et aucun test n'a été affaibli.
- [ ] Aucune donnée personnelle dans les journaux, aucun secret dans le code.
- [ ] Le code écrit par un agent a été relu comme celui d'un collègue.
FIN
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `git switch -c feature/guardrails develop` | crée la branche `feature/guardrails` à partir de `develop`, et s'y place |
> | `mkdir -p .gitea` | crée le dossier s'il n'existe pas ; `-p` ne proteste pas s'il existe déjà |
> | `cat > … <<'FIN'` … `FIN` | écrit les lignes comprises entre les deux `FIN` dans le fichier |

Le modèle sera publié avec la première pull request, à l'étape suivante.

```verify
F=~/byte-layers/quality-day/rhpilot/.gitea/pull_request_template.md
[ -f "$F" ] || { echo "Le fichier $F n'existe pas : relancez la commande de la section 04.4."; exit 1; }
[ "$(git -C ~/byte-layers/quality-day/rhpilot branch --show-current)" = "feature/guardrails" ] || { echo "Vous n'êtes pas sur la branche feature/guardrails : lancez git switch feature/guardrails."; exit 1; }
echo "Le modèle de pull request est prêt, sur la branche feature/guardrails."
```
