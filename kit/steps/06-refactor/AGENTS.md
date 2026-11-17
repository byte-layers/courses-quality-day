# RHPilot, module candidatures

Serveur Express 5 et PostgreSQL 18 sous Node.js 24 ; page web en HTML et JavaScript, sans framework.

## Commandes

- `npm run lint` : ESLint, zéro avertissement toléré au-delà du seuil de `package.json`.
- `npm test` : tests unitaires et tests de l'API, avec la base décrite par `DATABASE_URL` dans `.env`.

## Règles

1. N'écris jamais de SQL en collant une valeur dans le texte de la requête : passe les valeurs en paramètres (`$1`, `$2`…).
2. N'importe le module `pg` que dans `src/db.js` ; le reste du code passe par `src/db.js`.
3. N'écris ni email ni numéro de téléphone dans les journaux, et n'utilise pas `console.log` directement.
4. Ne mets aucun secret, jeton ou mot de passe dans le code, même comme valeur par défaut.
5. Compare avec `===` et `!==`, jamais `==` ni `!=`.
6. Ne modifie jamais un test de `test/` ou `e2e/` pour le faire passer : corrige le code.
7. Ne modifie pas `eslint.config.js`, `sonar-project.properties`, `playwright.config.js` ni `.gitea/workflows/`.
8. Ne construis jamais de HTML avec des données (`innerHTML`) : utilise `textContent` ou `createElement`.
9. Garde chaque fonction simple : une complexité cognitive de 15 au plus.
10. Lance `npm run lint` et `npm test` avant de proposer un commit.
11. Une branche par issue, nommée `feature/<sujet>`, et une pull request vers `develop`.
12. Écris en français les messages que voit l'utilisateur.
