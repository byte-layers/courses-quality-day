async function loadOffers() {
  const offers = await (await fetch('/api/offers')).json();
  const select = document.getElementById('offer');
  for (const o of offers) {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.title + ' (' + o.team + ')';
    select.appendChild(opt);
  }
}

function recruiterHeaders() {
  return { 'x-recruiter-token': document.getElementById('token').value };
}

// Une cellule de tableau remplie avec textContent : un nom qui contient du HTML reste du texte.
function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

document.getElementById('apply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = document.getElementById('apply-result');
  result.textContent = res.ok ? 'Merci, votre candidature est envoyée.' : 'Erreur : vérifiez le formulaire.';
  if (res.ok) e.target.reset();
});

document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = encodeURIComponent(document.getElementById('q').value);
  const res = await fetch('/api/applications?q=' + q, { headers: recruiterHeaders() });
  const rows = document.getElementById('rows');
  if (!res.ok) {
    rows.replaceChildren(cell('Jeton refusé'));
    return;
  }
  rows.replaceChildren();
  for (const a of await res.json()) {
    const tr = document.createElement('tr');
    tr.append(cell(a.id), cell(a.first_name + ' ' + a.last_name), cell(a.email), cell(a.offer_title), cell(a.status));
    rows.appendChild(tr);
  }
});

// L'export passe le jeton dans l'en-tête, puis propose le fichier reçu au téléchargement.
document.getElementById('export').addEventListener('click', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/applications/export.csv', { headers: recruiterHeaders() });
  if (!res.ok) return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await res.blob());
  link.download = 'candidatures.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});

try {
  await loadOffers();
} catch {
  document.getElementById('apply-result').textContent = 'Les offres ne sont pas disponibles.';
}
