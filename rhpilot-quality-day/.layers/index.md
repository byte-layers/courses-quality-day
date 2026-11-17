---
title: "RHPilot : rembourser la dette avant l'audit"
description: "Lab d'une journée : une application RH en Node.js doit passer un audit ISO 27001 et RGPD. État des lieux avec SonarQube et npm audit, décision d'utiliser des agents de code, garde-fous, gitflow sur Gitea, remaniement avec ou sans agent, AGENTS.md, skill, hook, et un scénario complet de l'issue à la fusion."
tags:
  - lab
  - quality
  - ai
difficulty: intermediate
duration: 360
introTitle: "Le lab"
requires: "0.4.0"
options:
  allowManualProgress: false
  autoCompleteOnNext: unverifiable
---

**RHPilot** édite un logiciel de recrutement en ligne. Un grand client veut signer, à deux conditions : que RHPilot soit certifiée **ISO 27001** et qu'elle signe un contrat de sous-traitance **RGPD**. L'audit a lieu dans trois mois. Le premier passage d'un auditeur sur le module « candidatures » se termine par une phrase : *trop de dette*. Votre CTO a une idée : « On réécrit tout avec l'IA, en un week-end. »

Ce lab est une journée complète, qui reprend ce que vous avez vu sur la qualité du code et sur les agents de code. Vous faites l'état des lieux du module, vous décidez comment rembourser sa dette, vous posez des garde-fous, puis vous laissez un agent travailler dans ce cadre, jusqu'à livrer une fonction demandée par le client.

**Niveau** : avoir suivi les stacks [Qualité du code](https://byte-layers.com/fr/stacks/code-quality) et [Agents de code IA](https://byte-layers.com/fr/stacks/ai-coding-agents), ou savoir lire du JavaScript, lancer `npm test` et faire une pull request. Chaque commande est expliquée.

**Ce qu'il faut** :

- **Docker** qui tourne, avec au moins 6 Go de mémoire et 8 Go de disque libres : SonarQube et l'image Playwright sont gros. Docker Desktop sous macOS et Windows, Docker Engine sous Linux ;
- **Git**, **Node.js 24** et **curl** ;
- **VS Code** avec un agent de code qui lit `AGENTS.md`, par exemple **Kilo Code**, installé dans le lab [Préparer son poste](https://byte-layers.com/fr/labs/ai-agent-workstation). L'agent est facultatif : chaque étape où il intervient a un chemin sans agent ;
- un navigateur, avec une **fenêtre de navigation privée** pour jouer un second utilisateur.

Tout tourne sur votre poste : aucun compte en ligne n'est nécessaire. Les fichiers du lab vivent dans `~/byte-layers/quality-day`.

**Sous Windows**, tapez les commandes dans le terminal **Git Bash**, livré avec Git. **Sous Linux**, SonarQube demande un réglage du noyau, donné à l'étape 01.

> 💡 **Si vous prenez du retard.** Chaque étape qui modifie le code a un état de rattrapage : un script copie dans votre dépôt le code tel qu'il doit être à la fin de l'étape. Il est indiqué en fin d'étape.
