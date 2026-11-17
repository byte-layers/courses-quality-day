---
title: "03 - La décision : réécrire, rembourser, ou confier à des agents ?"
description: "Chiffrer les options, choisir des agents de code avec des garde-fous, et découvrir la pyramide de confiance qui structure la suite"
---

L'état des lieux est fait : une gate rouge, une liste de constats, trois mois avant l'audit. Il faut maintenant décider comment rembourser. Cette étape ne contient pas de commande : c'est la réunion où l'équipe tranche.

## 03.1 - Trois options sur la table

L'équipe a estimé les constats de l'étape 02. SonarQube annonce environ une heure et demie de dette : c'est le coût des corrections qu'il sait chiffrer, pas celui des problèmes qu'il ne voit pas. Pour tout couvrir (tests de l'API, remaniement, failles, droit à l'effacement), l'équipe compte **huit jours** de travail à la main.

| Option | Pour | Contre |
|---|---|---|
| **Réécrire avec l'IA**, l'idée du CTO | un code neuf, en apparence vite | aucun test pour vérifier que la nouvelle version fait comme l'ancienne ; des comportements implicites perdus (le dédoublonnage par email, le format CSV attendu par le tableur des RH) ; l'auditeur regarde **comment** le code est produit, et un code neuf sans processus ne répond pas à sa question |
| **Rembourser à la main** | maîtrisé | huit jours, pendant lesquels rien d'autre n'avance |
| **Rembourser avec des agents de code** | le gros du remaniement en quelques heures | un agent qui obéit mal à ses consignes, ou des tests qu'il modifie pour qu'ils passent : à encadrer |

Réécrire n'est pas absurde en soi : pour un petit module bien couvert par des tests, avec un comportement simple, l'option se chiffre et se compare. Ici, sans tests, on ne saurait même pas dire si la réécriture est juste.

L'équipe choisit la troisième option : **des agents, avec des garde-fous**. Reste à savoir lesquels, et dans quel ordre.

## 03.2 - La pyramide de confiance

Lauren Tan, ingénieure connue sous le pseudonyme **@poteto**, a présenté dans une conférence la façon dont elle fait confiance au code de ses agents. Elle range les protections sur une échelle, de la plus contraignante à la moins contraignante : le code lui-même, l'analyse statique, les règles et skills données aux agents, puis le guide de style que seule une relecture humaine fait respecter. On la représente souvent en pyramide inversée : plus une protection est basse, plus elle est solide et plus elle doit porter. Elle traite à part la **vérification** (tests, outils qui prouvent qu'un changement marche) ; on l'ajoute ici comme un étage, juste après l'analyse statique.

La journée ne suit pas la pyramide du bas vers le haut : on pose d'abord le cadre de la relecture humaine (étape 04), parce que chaque changement de la journée, y compris ceux qui construisent les autres étages, doit passer par une pull request relue.

| Étage | Ce que c'est | Pourquoi |
|---|---|---|
| 1. **le code lui-même** | un code organisé pour que le chemin facile soit le bon : un seul module pour la base, une configuration qui refuse de démarrer sans secret | l'agent imite ce qu'il voit ; un bon code est la consigne la plus durable |
| 2. **l'analyse statique** | lint, SonarQube : des règles vérifiées à chaque modification | une règle vérifiée par un outil ne s'oublie pas |
| 3. **la vérification** | tests, couverture, pipeline : la preuve que le comportement est juste | l'agent sait si son travail marche avant de rendre la main |
| 4. **la prose** | `AGENTS.md`, skills, consignes | utile pour ce qu'aucun outil ne vérifie, mais un modèle peut l'ignorer |
| 5. **la relecture humaine** | la revue de la pull request | indispensable, mais la plus chère et la plus faillible : on relit mal un gros diff |

L'erreur courante est de tout mettre en haut : un long `AGENTS.md` plein d'interdictions, et une relecture humaine censée tout rattraper. La pyramide demande l'inverse : **faire descendre chaque règle le plus bas possible**.

La suite du lab suit cette logique, en commençant par cadrer le travail :

| Étape | Étage |
|---|---|
| 04 Organiser : gitflow, protections de branche, relecture obligatoire | relecture humaine, cadrée dès le départ |
| 05 Garde-fous : lint, tests, couverture, audit, SonarQube dans le pipeline | analyse statique et vérification |
| 06 Remodeler le code, avec ou sans agent | le code lui-même |
| 07 Réduire la prose, ajouter skill, permissions et hook | la prose, et ce qui la remplace |
| 08 Une fonction complète, de l'issue à la fusion | tous les étages ensemble |

> 📺 [Lauren Tan, « How I Shipped 2000 PRs Last Month — Trusting AI Agents » (vidéo de 38 minutes, en anglais)](https://www.youtube.com/watch?v=NjoZoUm85x0)

## 03.3 - Un piège : « on pseudonymise, donc l'IA Act ne s'applique pas »

Pendant la réunion, quelqu'un propose une autre piste : ajouter à RHPilot un **tri automatique des candidatures** par IA, en ne lui envoyant que des données pseudonymisées, « pour rester hors du règlement européen sur l'IA ». La piste est hors du périmètre de la journée, mais l'argument est faux, et il revient souvent.

> ⚠️ **Pseudonymiser ne change pas la catégorie d'un système d'IA.** Le règlement européen sur l'IA (*AI Act*) classe un système selon son **usage**. Son annexe III, point 4, range parmi les systèmes à **haut risque** ceux qui servent à recruter, en particulier à filtrer ou à évaluer des candidatures. Un tri de candidatures reste dans cette catégorie, que les données soient nominatives ou pseudonymisées : il évalue des personnes, ce que le règlement appelle du profilage, et l'article 6, paragraphe 3, prévoit qu'un système qui fait du profilage reste toujours à haut risque. Pseudonymiser reste une bonne mesure au titre du RGPD, qui continue de s'appliquer aux données pseudonymisées.
>
> Le calendrier a bougé : l'omnibus numérique sur l'IA, adopté en 2026, a reporté au **2 décembre 2027** les obligations des systèmes à haut risque de l'annexe III, initialement prévues pour le 2 août 2026. Vérifiez la date en vigueur au moment où vous lisez ces lignes.

```quiz
title: La décision
tracksProgress: true
submitMode: last-only
questions:
  - prompt: Pourquoi réécrire le module avec l'IA est-il risqué ici ?
    answers:
      - "Parce que sans tests, rien ne dit que la nouvelle version se comporte comme l'ancienne"
      - "Parce qu'une IA ne sait pas écrire du JavaScript"
      - "Parce que la réécriture coûterait plus de huit jours"
      - "Parce que l'auditeur interdit l'usage de l'IA"
    correct: 1
    explanation: |
      Une réécriture change tout le code d'un coup. Sans tests qui décrivent le comportement
      attendu, impossible de savoir ce qui a été perdu.
  - prompt: Dans la pyramide de confiance, quel étage est le plus solide ?
    answers:
      - "La relecture humaine"
      - "Un AGENTS.md détaillé"
      - "Le code lui-même, organisé pour que le chemin facile soit le bon"
      - "Les consignes données à l'agent dans la conversation"
    correct: 3
    explanation: |
      L'agent imite le code qu'il voit. Une règle inscrite dans la structure du code, par
      exemple un seul module autorisé à parler à la base, ne dépend ni de sa mémoire ni de
      sa bonne volonté.
  - prompt: Une règle est écrite dans AGENTS.md, et un outil peut la vérifier. Que conseille la pyramide ?
    answers:
      - "La garder dans AGENTS.md, c'est plus lisible"
      - "La faire vérifier par l'outil, puis la retirer de la prose"
      - "La répéter à chaque conversation avec l'agent"
      - "La confier à la relecture humaine"
    correct: 2
    explanation: |
      Un modèle peut ignorer une consigne, pas un lint ou un test qui échoue. La prose garde
      ce qu'aucun outil ne sait vérifier.
  - prompt: RHPilot ajoute un tri de candidatures par IA sur des données pseudonymisées. Que dit le règlement européen sur l'IA ?
    answers:
      - "Il ne s'applique pas, puisque les données sont pseudonymisées"
      - "Le système est interdit"
      - "Seul le RGPD s'applique"
      - "Le système reste à haut risque : il sert au recrutement, et évalue des personnes"
    correct: 4
    explanation: |
      L'annexe III, point 4, classe à haut risque les systèmes de recrutement. Le profilage
      maintient ce classement, et le RGPD s'applique aussi aux données pseudonymisées.
```
