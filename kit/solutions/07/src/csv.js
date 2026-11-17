// Export CSV au format attendu par le tableur des RH (séparateur point-virgule).
function escapeCsv(value) {
  const text = String(value ?? '');
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(columns, rows) {
  const lines = [columns.map((c) => c.header).join(';')];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsv(row[c.field])).join(';'));
  }
  return lines.join('\n') + '\n';
}
