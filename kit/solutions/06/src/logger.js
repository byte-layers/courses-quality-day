// Journal de l'application. Il masque les données personnelles avant d'écrire :
// un journal est copié, envoyé, gardé longtemps, et lu par bien plus de monde que la base.
const PHONE = /(\+33|0)\d([ .-]?\d{2}){4}/g;

export function mask(text) {
  const words = String(text).split(' ').map((word) => (word.includes('@') ? '[email]' : word));
  return words.join(' ').replace(PHONE, '[téléphone]');
}

export const logger = {
  info: (message) => console.log(`[info] ${mask(message)}`),
  error: (message) => console.error(`[erreur] ${mask(message)}`),
};
