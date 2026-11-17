// Petites fonctions partagées.

export function isValidEmail(email) {
  // TODO: vraie validation un jour
  return typeof email === 'string' && email.includes('@');
}

export function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(' ', '');
}

export function formatDate(d) {
  const date = new Date(d);
  return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

// Ancienne version, gardée au cas où
// export function escapeCsv(value) {
//   return '"' + value + '"';
// }
