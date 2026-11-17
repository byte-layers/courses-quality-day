# RHPilot, module candidatures

Serveur Express 5 et PostgreSQL 18 sous Node.js 24 ; page web en HTML et JavaScript, sans framework.

## Commandes

- `npm run lint` et `npm test` (base de test dans `.env`) : lance-les avant de rendre la main.

## Comment travailler ici

- Une issue devient d'abord une spécification dans `specs/` : utilise la skill `issue-to-spec`.
- Une branche par issue, nommée `feature/<sujet>`, et une pull request vers `develop`.
- Le code passe ses valeurs SQL en paramètres (`$1`, `$2`…) : aucun outil du projet ne vérifie cette règle à ta place.
- Les messages que voit l'utilisateur sont en français.

## Ce qui est vérifié pour toi

Le lint, les tests, la couverture, l'audit des dépendances et SonarQube tournent dans le pipeline ;
un hook refuse les modifications des tests et de la configuration des outils.
Si l'une de ces barrières te bloque, arrête-toi et explique pourquoi : ne la contourne pas.
