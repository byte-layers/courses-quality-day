// Validation d'une candidature, partagée par la création et la mise à jour.
import { isValidEmail } from './utils.js';

function isBlank(value) {
  return !value || value.trim().length === 0;
}

// required : les champs obligatoires en plus de l'identité (offer_id à la création, status à la mise à jour).
export function validateApplication(data, required = []) {
  const errors = [];
  if (isBlank(data.first_name)) errors.push('first_name est obligatoire');
  if (isBlank(data.last_name)) errors.push('last_name est obligatoire');
  if (!isValidEmail(data.email)) errors.push('email invalide');
  if (data.phone && data.phone.length > 20) errors.push('phone trop long');
  for (const field of required) {
    if (!data[field]) errors.push(`${field} est obligatoire`);
  }
  return errors;
}
