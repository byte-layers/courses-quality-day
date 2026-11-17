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
  const token = document.getElementById('token').value;
  const q = document.getElementById('q').value;
  document.getElementById('export').href = '/api/applications/export.csv?token=' + token;
  const res = await fetch('/api/applications?q=' + q, { headers: { 'x-recruiter-token': token } });
  if (!res.ok) {
    document.getElementById('rows').innerHTML = '<tr><td colspan="5">Jeton refusé</td></tr>';
    return;
  }
  const rows = await res.json();
  let html = '';
  for (const a of rows) {
    html += '<tr><td>' + a.id + '</td><td>' + a.first_name + ' ' + a.last_name + '</td><td>' + a.email
      + '</td><td>' + a.offer_title + '</td><td>' + a.status + '</td></tr>';
  }
  document.getElementById('rows').innerHTML = html;
});

loadOffers();
