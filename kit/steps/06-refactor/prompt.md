Lis AGENTS.md, puis remanie le module candidatures sans changer son comportement.
Les tests de test/ décrivent le comportement attendu : ils doivent passer sans être modifiés.

1. Crée src/config.js : il lit DATABASE_URL, RECRUITER_TOKEN et PORT dans l'environnement,
   et lance une erreur au démarrage si DATABASE_URL ou RECRUITER_TOKEN manque. Aucune valeur par défaut.
2. Crée src/db.js : le seul fichier qui importe pg. Il exporte pool et une fonction query(text, params).
   Toutes les requêtes passent leurs valeurs en paramètres ($1, $2…), y compris la recherche par nom.
3. Crée src/logger.js : logger.info et logger.error masquent les emails et les numéros de téléphone
   avant d'écrire. Il exporte aussi mask(text), qui remplace chaque email par [email] et chaque numéro
   de téléphone par [téléphone]. Remplace tous les console.log de src/ par ce logger, sans données personnelles.
4. Dans src/routes/applications.js : une seule fonction de validation pour la création et la mise à jour
   (src/validation.js), une seule fonction d'échappement CSV (src/csv.js), des filtres construits en SQL
   au lieu des if imbriqués, un dédoublonnage par email en un seul passage. Supprime lodash.
5. src/auth.js lit le jeton dans la configuration, et ne l'accepte plus que dans l'en-tête x-recruiter-token.
   Garde l'export RECRUITER_TOKEN : les tests l'utilisent.
6. public/app.js : remplace innerHTML par textContent ou createElement ; l'export CSV passe le jeton
   dans l'en-tête et télécharge le fichier reçu.
7. db/seed.js : plus de valeur par défaut pour DATABASE_URL.
8. Supprime le code mort et le code commenté de src/utils.js.

Termine par npm run lint et npm test, et montre-moi le résumé des deux.
