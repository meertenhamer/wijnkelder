// Zet CSV-exports uit Supabase om naar een SQL-bestand voor Cloudflare D1.
//
// Gebruik:
//   node scripts/supabase-csv-naar-sql.mjs <email> <wines.csv> [wine_locations.csv] > import.sql
//   npx wrangler d1 execute wijnkelder --remote --file import.sql
//
// <email> is het e-mailadres waarmee je via Cloudflare Access inlogt;
// alle wijnen en locaties worden aan die gebruiker gekoppeld.

import { readFileSync } from 'node:fs';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

const sql = (v) => (v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === '' || v === undefined || isNaN(Number(v)) ? 'NULL' : String(Number(v)));
const date = (v) => (v ? sql(new Date(v).toISOString()) : sql(new Date().toISOString()));

const [email, winesFile, locationsFile] = process.argv.slice(2);
if (!email || !winesFile) {
  console.error('Gebruik: node scripts/supabase-csv-naar-sql.mjs <email> <wines.csv> [wine_locations.csv]');
  process.exit(1);
}
const user = sql(email.toLowerCase());
const out = [];

for (const w of parseCsv(readFileSync(winesFile, 'utf8'))) {
  out.push(
    `INSERT OR REPLACE INTO wines (id, user_id, name, year, grapes, quantity, country, region, type, best_before, taste_profile, pairing_advice, fun_fact, notes, rating, location, created_at) VALUES (` +
      [sql(w.id), user, sql(w.name), num(w.year), sql(w.grapes), num(w.quantity) === 'NULL' ? '0' : num(w.quantity),
       sql(w.country), sql(w.region), sql(w.type || 'rood'), sql(w.best_before), sql(w.taste_profile),
       sql(w.pairing_advice), sql(w.fun_fact), sql(w.notes), num(w.rating), sql(w.location), date(w.created_at)].join(', ') +
      ');'
  );
}

if (locationsFile) {
  for (const l of parseCsv(readFileSync(locationsFile, 'utf8'))) {
    out.push(
      `INSERT OR REPLACE INTO wine_locations (id, user_id, name, created_at) VALUES (${sql(l.id)}, ${user}, ${sql(l.name)}, ${date(l.created_at)});`
    );
  }
}

console.log(out.join('\n'));
console.error(`${out.length} regels gegenereerd.`);
