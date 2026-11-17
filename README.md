# courses-quality-day

Un lab byte_layers d'une journée, hors path et hors stack : **RHPilot : rembourser la dette avant
l'audit** (`rhpilot-quality-day/`). Une application RH en Node.js doit passer un audit ISO 27001 et
RGPD ; l'apprenant fait l'état des lieux (SonarQube, npm audit), pose des garde-fous, organise le
travail en gitflow sur Gitea, remanie le code avec ou sans agent, réécrit `AGENTS.md`, puis livre
le droit à l'effacement de l'issue à la fusion.

| Dossier | Contenu |
|---|---|
| `rhpilot-quality-day/.layers/` | le texte du lab, étapes 01 à 09 |
| `kit/app/` | l'application RHPilot dans son état initial, avec sa dette |
| `kit/infra/` | la pile Docker Compose : PostgreSQL, l'application, Gitea, act_runner, SonarQube ; `init.sh` la configure |
| `kit/steps/` | les fichiers fournis à chaque étape, certains avec des `// TODO` |
| `kit/solutions/` | le code de l'application à la fin des étapes 05 à 08 ; `kit/catch-up.sh` le copie |

Le kit se clone dans `~/byte-layers/quality-day/course` et tout tourne sur le poste de l'apprenant.

Licence : CC BY-NC-SA 4.0.
