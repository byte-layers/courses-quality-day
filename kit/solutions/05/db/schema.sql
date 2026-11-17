CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  team TEXT NOT NULL,
  open BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER REFERENCES offers(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
