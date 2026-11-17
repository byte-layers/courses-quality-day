// Configuration lue dans l'environnement. Sans DATABASE_URL ni RECRUITER_TOKEN,
// l'application refuse de démarrer : aucune valeur par défaut ne peut partir en production.
const missing = ['DATABASE_URL', 'RECRUITER_TOKEN'].filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Configuration incomplète : définissez ${missing.join(' et ')}`);
}

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  recruiterToken: process.env.RECRUITER_TOKEN,
  port: Number(process.env.PORT || 3000),
};
