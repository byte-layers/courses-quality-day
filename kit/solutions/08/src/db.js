// Le seul module qui parle à PostgreSQL. Les requêtes passent leurs valeurs en paramètres
// ($1, $2…) : une valeur saisie par un utilisateur n'est jamais collée dans le texte SQL.
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function query(text, params = []) {
  return pool.query(text, params);
}
