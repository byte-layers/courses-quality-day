// Petites fonctions partagées.

export function isValidEmail(email) {
  if (typeof email !== 'string' || /\s/.test(email)) return false;
  const [local, domain, ...rest] = email.split('@');
  return rest.length === 0 && local.length > 0 && /^[^.]+(\.[^.]+)+$/.test(domain);
}

export function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replaceAll(' ', '');
}
