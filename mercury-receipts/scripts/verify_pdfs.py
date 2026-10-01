#!/usr/bin/env python3
"""uv run --with pypdf python3 verify_pdfs.py <receipts-dir>
Checks that each YYYY-MM-DD_<Vendor>_<amount>__*.pdf contains its amount; prints NO lines for review.
Split charges (e.g. airline ticket + add-ons) legitimately fail; read those by hand."""
import glob, os, sys
from pypdf import PdfReader
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.pdf'))):
    b = os.path.basename(f); amt = b.split('__')[0].rsplit('_', 1)[1]
    try:
        txt = ' '.join(p.extract_text() or '' for p in PdfReader(f).pages).replace(',', '')
    except Exception as e:
        print('ERR', b, e); continue
    ok = amt in txt or amt.rstrip('0').rstrip('.') in txt
    print('OK ' if ok else 'NO ', b)
