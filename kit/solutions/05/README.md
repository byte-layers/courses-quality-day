# RHPilot · module candidatures

Application interne de RHPilot : les candidats postulent à une offre, les recruteurs consultent et exportent les candidatures.

- `src/` : le serveur Express et ses routes ;
- `public/` : la page web, sans framework ;
- `db/` : le schéma et le jeu de données de test ;
- `test/` : les tests unitaires ;
- `e2e/` : les tests de bout en bout.

Démarrer en local : `npm install`, puis `npm run seed` et `npm start`, avec une base PostgreSQL décrite par `DATABASE_URL`.
