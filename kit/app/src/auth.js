// TODO: mettre le jeton ailleurs avant la mise en production
export const RECRUITER_TOKEN = 'rhp_live_8f3a2c9d1e7b4a60';

export function requireRecruiter(req, res, next) {
  // HACK: on accepte aussi le jeton dans l'adresse, sinon le lien d'export CSV ne marche pas dans le navigateur
  const token = req.get('x-recruiter-token') || req.query.token;
  if (token != RECRUITER_TOKEN) {
    return res.status(401).json({ error: 'non autorisé' });
  }
  next();
}
