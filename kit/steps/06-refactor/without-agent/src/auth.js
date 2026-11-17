import { config } from './config.js';

export const RECRUITER_TOKEN = config.recruiterToken;

// Le jeton recruteur se passe dans l'en-tête x-recruiter-token, jamais dans l'adresse :
// une adresse finit dans l'historique du navigateur et dans les journaux des serveurs.
export function requireRecruiter(req, res, next) {
  if (req.get('x-recruiter-token') !== RECRUITER_TOKEN) {
    return res.status(401).json({ error: 'non autorisé' });
  }
  next();
}
