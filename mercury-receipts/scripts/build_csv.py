#!/usr/bin/env python3
"""python3 build_csv.py tasks.json <receipts-dir> [notes.json] [--year 2026]

Writes <receipts-dir>/receipts.csv (FOUND first, then MISSING, newest first) and <receipts-dir>/upload_jobs.json.
A task is FOUND when a PDF named YYYY-MM-DD_<anything>_<amount>__*.pdf exists for its date and amount.
notes.json (optional) maps "YYYY-MM-DD|amount" -> source/notes text for the CSV.
The upload pick per task: a file with "booking-confirmation" in the name, else one with "receipt", else the first.
"""
import csv, datetime, glob, json, os, sys

argv = sys.argv[1:]
year = datetime.date.today().year
if '--year' in argv:
    i = argv.index('--year'); year = int(argv[i + 1]); del argv[i:i + 2]
tasks = json.load(open(argv[0])); d = argv[1]
notes = json.load(open(argv[2])) if len(argv) > 2 else {}
rows, jobs = [], []
for t in tasks:
    date = datetime.datetime.strptime(f"{t['date']} {year}", '%b %d %Y').date()
    if date > datetime.date.today():
        date = date.replace(year=year - 1)
    ds, amt = date.isoformat(), t['amount']
    files = sorted(glob.glob(os.path.join(d, f'{ds}_*_{amt}__*.pdf')))
    note = notes.get(f'{ds}|{amt}', '')
    rows.append(['FOUND' if files else 'MISSING', ds, t['vendor'], amt, ' ; '.join(files), note])
    if files:
        pick = next((f for f in files if 'booking-confirmation' in f), None) or \
               next((f for f in files if 'receipt' in os.path.basename(f).split('__', 1)[1].lower()), None) or files[0]
        jobs.append({'desc': f"at {t['vendor']} for ${amt}", 'date': t['date'], 'file': pick})
rows = sorted((r for r in rows if r[0] == 'FOUND'), key=lambda r: r[1], reverse=True) + \
       sorted((r for r in rows if r[0] == 'MISSING'), key=lambda r: r[1], reverse=True)
with open(os.path.join(d, 'receipts.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['status', 'date', 'vendor', 'amount_usd', 'pdf_path', 'source']); w.writerows(rows)
json.dump(jobs, open(os.path.join(d, 'upload_jobs.json'), 'w'), indent=1)
print(f"{sum(r[0] == 'FOUND' for r in rows)} found, {sum(r[0] == 'MISSING' for r in rows)} missing -> {d}/receipts.csv, {len(jobs)} upload jobs")
