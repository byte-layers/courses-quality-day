---
title: "09 - Bilan"
description: "Replacer chaque constat sur son étage de la pyramide, nommer les limites de ce qui a été fait, deux pistes pour aller plus loin, et ranger l'environnement"
---

La gate est verte, le droit à l'effacement est livré, et chaque modification de la journée est passée par une pull request relue. Prenons un peu de recul avant de ranger.

## 09.1 - Chaque constat sur son étage

| Constat de l'étape 02 | Ce qui l'empêche de revenir | Étage |
|---|---|---|
| mots de passe et jeton dans le code | `src/config.js` refuse de démarrer sans configuration ; SonarQube détecte les secrets | le code, l'analyse statique |
| `pg` et SQL éparpillés | `src/db.js`, et la règle `no-restricted-imports` | le code, l'analyse statique |
| injection SQL dans la recherche | des requêtes paramétrées… et une règle d'`AGENTS.md`, car aucun outil gratuit ne la vérifie | le code, la prose |
| données personnelles dans les journaux | `src/logger.js`, et la règle `no-console` | le code, l'analyse statique |
| XSS dans la liste | `textContent`, une règle de lint, un test de bout en bout | le code, l'analyse statique, la vérification |
| fonction de complexité 56, code copié | sonarjs dans le lint, SonarQube et sa gate | l'analyse statique |
| lodash vulnérable | `npm audit` bloquant dans le pipeline | la vérification |
| presque aucun test | tests de caractérisation, seuil de couverture, test de bout en bout | la vérification |
| aucune suppression possible | une spécification, des tests écrits avant le code | la prose, la vérification |
| un agent qui modifierait les tests | le hook, les permissions | le code (le hook), autour de la prose |
| tout ce qui précède, oublié par quelqu'un | protections de branche, pipeline obligatoire, relecture | la relecture humaine, cadrée par la forge |

Regardez la dernière colonne : l'essentiel est porté par le code, l'analyse statique et la vérification. La prose et la relecture humaine restent, mais pour ce qu'elles seules savent faire.

## 09.2 - Les limites

- **L'agent peut affaiblir les garde-fous.** Le hook regarde les outils d'écriture, pas toutes les commandes shell, et il ne protège pas `package.json`, où vivent le plafond du lint et le seuil de couverture : la permission `ask` les protège, mais seulement si vous lisez ce que vous acceptez. La relecture doit toujours regarder les fichiers de configuration et de test.
- **SonarQube Community ne suit qu'une branche.** Les pull requests ne sont protégées que par le lint, les tests et l'audit ; un problème que seul SonarQube voit n'apparaît qu'après la fusion.
- **Les outils gratuits ont des angles morts.** L'injection SQL de l'étape 02 n'a été vue que par vous. Une relecture de sécurité humaine, ou une analyse de flux, restent nécessaires.
- **La couverture n'est pas la qualité des tests.** 90 % des lignes exécutées ne disent pas que chaque comportement est vérifié : les tests de mutation, vus dans le lab [Tester les tests avec la mutation](https://byte-layers.com/fr/labs/mutation-testing), le mesurent.
- **L'audit ISO 27001 ne regarde pas que le code.** Gestion des accès, sauvegardes, procédure d'effacement dans les sauvegardes, durée de conservation des candidatures de 2019 : la journée a traité la part du développement.

## 09.3 - Pour aller plus loin

- **La revue de code par IA.** Des outils comme [open-codereview](https://open-codereview.ai/) commentent automatiquement chaque pull request. Ils ajoutent un relecteur infatigable, pas un relecteur responsable : leur avis passe avant la relecture humaine, pas à sa place.
- **Vers une factory logicielle.** Un script interroge la forge toutes les quelques minutes, prend chaque issue marquée `agent` et en `status/ready`, lance l'agent dessus dans une branche, et ouvre la pull request. C'est le début d'une **factory logicielle**. Attention : le texte d'une issue devient alors une consigne pour l'agent, et quiconque peut écrire une issue peut tenter une **injection de prompt**. Seules les issues validées par une personne de confiance doivent entrer dans la boucle.

## 09.4 - Ranger

L'environnement occupe plusieurs gigaoctets. Pour l'arrêter et supprimer ses données (dépôt Gitea, analyses SonarQube, bases), lancez :

```exec
cd ~/byte-layers/quality-day/course/kit/infra && docker compose --profile runner down -v
```

> 🔍 **Comprendre la commande**
>
> | Morceau | Rôle |
> |---|---|
> | `docker compose … down` | arrête et supprime les conteneurs du kit et son réseau |
> | `--profile runner` | inclut le runner, déclaré dans un profil à part pour être démarré par `init.sh` seulement après son enregistrement |
> | `-v` | supprime aussi les volumes : toutes les données de la journée |

Votre clone `~/byte-layers/quality-day/rhpilot` reste sur votre poste, avec tout l'historique. Les images Docker restent aussi ; `docker image rm` les supprime si vous voulez récupérer la place.

## Récap

- Un **état des lieux** se fait avec plusieurs outils, bien réglés, et une lecture humaine : SonarQube mal configuré annonçait zéro dette, et aucun outil gratuit n'a vu l'injection SQL.
- La **quality gate** traduit l'objectif en conditions vérifiables, sur tout le code.
- Avant de laisser travailler un agent, on pose des **garde-fous** : lint avec cliquet, tests de caractérisation, seuil de couverture, audit bloquant, pipeline obligatoire.
- La pyramide de confiance fait descendre chaque règle : d'abord **le code**, puis **l'analyse statique** et **la vérification**, puis **la prose**, et enfin **la relecture humaine**.
- `AGENTS.md` passe de règlement à **plan de travail** ; un **hook** et des **permissions** protègent les garde-fous de l'agent.
- Une fonction se livre de l'issue à la fusion : **spécification**, **tests d'abord**, code, test de bout en bout, statuts, relecture.

> 📖 [RGPD, article 17 : droit à l'effacement](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3#Article17) · [Règlement européen sur l'IA, annexe III](https://artificialintelligenceact.eu/annex/3/) · [ESLint, configuration (en anglais)](https://eslint.org/docs/latest/use/configure/configuration-files) · [eslint-plugin-sonarjs (en anglais)](https://www.npmjs.com/package/eslint-plugin-sonarjs) · [Node.js, couverture des tests (en anglais)](https://nodejs.org/api/test.html#collecting-code-coverage) · [AGENTS.md (en anglais)](https://agents.md/)

```quiz
title: Bilan de la journée
tracksProgress: true
submitMode: last-only
questions:
  - prompt: Pourquoi a-t-on posé les tests de caractérisation avant de remanier le code ?
    answers:
      - "Pour que tout changement de comportement pendant le remaniement fasse échouer un test"
      - "Pour atteindre 80 % de couverture"
      - "Parce que SonarQube l'exige"
      - "Pour tester le code de l'agent"
    correct: 1
    explanation: |
      Un test de caractérisation décrit ce que le code fait aujourd'hui. Remanier, c'est changer
      la structure sans changer le comportement : les tests le prouvent.
  - prompt: L'AGENTS.md réduit ne dit plus « n'utilise pas console.log ». Pourquoi ?
    answers:
      - "Parce que l'agent le sait déjà"
      - "Parce que les journaux ne sont plus utiles"
      - "Parce que AGENTS.md doit faire moins de dix lignes"
      - "Parce que la règle no-console du lint l'impose, et que le pipeline bloque une pull request qui l'enfreint"
    correct: 4
    explanation: |
      Une règle vérifiée par un outil n'a plus besoin d'être écrite : le lint échoue, l'agent
      voit l'erreur et corrige.
  - prompt: Quelle règle est restée dans AGENTS.md, faute d'outil pour la vérifier dans ce projet ?
    answers:
      - "Comparer avec ==="
      - "N'importer pg que dans src/db.js"
      - "Passer les valeurs SQL en paramètres"
      - "Ne pas construire de HTML avec innerHTML"
    correct: 3
    explanation: |
      Rien n'empêche d'écrire query("… " + valeur) dans une route : ni le lint, ni SonarQube
      Community ne le voient. La règle reste en prose.
  - prompt: Pourquoi SonarQube ne tourne-t-il pas sur les pull requests dans ce lab ?
    answers:
      - "Parce qu'il est trop lent"
      - "Parce que l'édition Community n'analyse qu'une branche ; une analyse de pull request écraserait celle de develop"
      - "Parce que Gitea ne le permet pas"
      - "Parce que le lint fait la même chose"
    correct: 2
    explanation: |
      Les éditions payantes analysent branches et pull requests. Avec la Community, on protège
      les pull requests par le lint, les tests et l'audit, et SonarQube suit develop.
  - prompt: Un script lance un agent sur chaque issue marquée agent. Quel risque faut-il traiter en premier ?
    answers:
      - "Le coût des appels au modèle"
      - "La lenteur du script"
      - "L'injection de prompt : le texte d'une issue devient une consigne pour l'agent"
      - "Le nombre de branches créées"
    correct: 3
    explanation: |
      Quiconque peut écrire une issue peut glisser des instructions à l'agent. Seules les issues
      validées par une personne de confiance doivent entrer dans la boucle.
```
