---
name: mercury-receipts
description: "Clear Mercury's \"Upload receipt\" tasks end to end: catalog the open tasks at app.mercury.com/tasks, find each receipt in Gmail (work and personal inboxes) or in the vendor's billing portal (ChatGPT, Alpaca, Crisp, claude.ai, any Stripe portal), save PDFs and a found/missing CSV in ~/Miscellaneous/mercury-receipts, then upload each PDF to its Mercury transaction. Use when the user mentions Mercury tasks, missing receipts, receipt uploads, or expense documentation for the company card."
---

# Mercury receipts

Clear Mercury's "Upload receipt for your transaction at X for $Y" tasks. The work runs in the logged-in agent Chrome over CDP (`http://127.0.0.1:9333`) with Playwright scripts. The scripts are in `scripts/` next to this file. Screenshots are only for checking ambiguous states.

Output folder: `~/Miscellaneous/mercury-receipts/`. Name each PDF `YYYY-MM-DD_<Vendor>_<amount>__<what>.pdf`, where the date is the task's **Received** date and the amount has two decimals. Each script lists its usage in its header comment.

## 1. Catalog the tasks

```bash
node scripts/mercury_tasks.js > /tmp/tasks.json   # [{vendor, amount, date:"Mon D", desc}]
```

Each row's dates are the transaction ("Received") dates. The "Due by" column is usually empty. The table renders skeleton rows first, and the script waits for real rows or for "No pending tasks". Group the tasks by vendor and note recurring patterns. A vendor charged twice a month for the same amount usually means two accounts, such as a work one and a personal one.

## 2. Search the inboxes

The receipts are split across the Gmail accounts in agent Chrome (`mail/u/0`, `u/1`, ...). Find which index is which with `fetch('/mail/u/N/feed/atom')` and read the title. If an account isn't signed in, add it at `accounts.google.com/AddSession`. The company card pays for both work and personal vendor accounts, so search **every** inbox.

The best first pass is to search for the exact amount within a window of 5 days before to 6 days after the task date:

```bash
# queries.json: {"00": "\"78.56\" after:2026/09/26 before:2026/10/07", ...}
node scripts/gmail_search.js 1 queries.json /tmp/s1.json
node scripts/gmail_search.js 0 queries.json /tmp/s0.json
```

Ignore Mercury's own "requires a receipt" and "Reminder" emails. For the gaps, search by vendor name without the amount, because some receipts show the amount only inside a PDF.

Then download the matches:

```bash
# jobs.json: [{"key":"2026-09-13_Anthropic_200.00","acct":0,"q":"subject:\"receipt from Anthropic, PBC #1234-5678-9012\""}]
node scripts/gmail_download.js jobs.json ~/Miscellaneous/mercury-receipts
```

- **Stripe receipt emails** carry `Invoice-*.pdf` and `Receipt-*.pdf` attachments, and the script saves both.
- **Emails without attachments** (airline confirmations, "Your invoice" notices) are printed to PDF.
- **Airlines:** the booking confirmation shows the full charged total. The later eTicket receipt may split it into ticket plus add-ons. Save both and upload the one with the total.
- **Links instead of attachments:** some emails only link to an invoice (Crisp's renewal emails, for example). Fetch the link with `ctx.request.get` and check it starts with `%PDF`.
- **Check the amount:** a vendor email in the date window can be for a different charge, such as a prorated fee or a failed payment. Read the PDF before counting it as found.

## 3. Use vendor billing portals for the rest

Sign in with the user's 1Password entries. Never type or print secrets.

- **1Password:** fill passwords from the extension's inline menu. Click the 1Password icon inside the field, then the right item with `page.mouse.click`, which counts as trusted input. The top banner offers only one suggestion, so open "Other options" when it suggests the wrong account.
- **Google sign-in with 2FA:** if Chrome reports "No passkeys available" on the passkey route, choose "More ways to verify" and then the authenticator code. The 1Password inline menu on the code field fills and submits the TOTP.
- **Split six-box OTP inputs** (Alpaca, for example) have no inline menu. Open the item in the 1Password desktop app (`xdotool`, DISPLAY=:1) and click the one-time password field, which copies it. Then click the first box in Chrome and press `Control+V`. Wait for a fresh code if fewer than about 6 seconds remain.
- **Email confirmation links**, such as "confirm login from an unusual location":
  ```bash
  node scripts/gmail_open_link.js <acct> "from:vendor.com newer_than:1d" "confirm|verify"
  ```
- **CAPTCHA:** don't solve it. Stop, try again later, or leave that one for the user.

Any tab that lists invoices linking to `invoice.stripe.com` can be downloaded in one pass:

```bash
node scripts/stripe_invoices_download.js <tab-url-part> <Vendor> ~/Miscellaneous/mercury-receipts [dates.json]
```

`dates.json` keeps only the listed rows and maps each invoice date to its Mercury task date, for example `{"2026-06-30":"2026-07-02"}` when a failed charge was retried later.

Vendor notes:

| Vendor | Where the invoices are |
|---|---|
| ChatGPT (OpenAI) | On chatgpt.com, `GET /backend-api/payments/customer_portal` with the session token from `/api/auth/session` returns a pay.openai.com Stripe portal URL. Click "View more" until it's gone, then run the Stripe script. Each account has its own portal. To switch accounts, POST `/api/auth/signout` with the csrf token, then sign in with Google again. |
| OpenAI Platform | platform.openai.com may return 403 for its static assets in this Chrome. Check ChatGPT first, since the subscription charges are usually there. |
| Alpaca (AlpacaDB) | app.alpaca.markets → Plans & Features → Manage Subscription. The invoice table rows link to invoice.stripe.com, with dates as MM/DD/YYYY. To switch accounts, clear site data with CDP `Storage.clearDataForOrigin`. |
| Crisp | app.crisp.chat/settings/billing → Invoices. "Download" buttons for each month open a storage.crisp.chat PDF (catch the popup or the download). A new location triggers an email confirmation. |
| Anthropic / Claude | claude.ai/settings/billing → Invoices → "Download PDF" for the row. Stripe receipt emails also go to the account's email. |
| Railway, Blacksmith, ui.sh (Link), Anthropic | Stripe receipt emails with attachments. Blacksmith also sends a Lago invoice email. |
| Hetzner, OVHcloud, IHG, United | Invoice or folio emails (attachment, or a printed email). |
| Uber | No billing portal. Receipts are in the Uber app's trip history, and login needs a phone or email code. |

## 4. Catalog, check, and upload

```bash
python3 scripts/build_csv.py /tmp/tasks.json ~/Miscellaneous/mercury-receipts [notes.json] --year 2026
uv run --with pypdf python3 scripts/verify_pdfs.py ~/Miscellaneous/mercury-receipts
```

- **`receipts.csv`:** found tasks first, then missing ones, newest first within each group. Columns: status, date, vendor, amount, pdf_path, source.
- **`upload_jobs.json`:** one PDF per task. The pick order is a booking confirmation, then the receipt, then the first file. A task counts as found when a PDF matches its date and amount.
- **`notes.json`:** maps `"YYYY-MM-DD|amount"` to the source text (which inbox or account), and tells the user where each missing receipt can be found.
- **`verify_pdfs.py`:** flags PDFs that don't contain their amount. Split charges are the expected exception.

Upload to Mercury only after the user asks for it:

```bash
node scripts/mercury_upload.js ~/Miscellaneous/mercury-receipts/upload_jobs.json
```

For each job, the script clicks the task row (matching description plus Received date), sets the file on the input next to "Drag and drop here or click to upload" in the transaction side panel, and waits for the filename to appear. Run it in the background for many tasks. Afterwards, check on your own by reloading `/tasks`: the "Tasks N" badge and remaining rows should show only what you couldn't find.

## Gotchas

- **Gmail:** click the subject (`.y6`), not the row. Rows with attachment chips open the attachment viewer (`?projector=1`), which hangs the script.
- **Printing to PDF:** `Page.printToPDF` works on headed Chrome through a CDP session when used on Gmail's `view=pt` print page.
- **Shell quoting:** pass multi-line page code to `scripts/tab.js` as `@file.js` to avoid shell-quoting errors.
- **Retried charges:** Mercury dates a task by the successful charge. A vendor invoice can be dated at the failed first attempt a few days earlier, so map it with `dates.json`.
- **Cleanup:** close the billing-portal tabs when done. Their URLs carry session secrets, so never print them.
- **The user's notes:** the vendor-to-account map (which inbox or login holds which vendor) belongs in the user's memory, not in this public skill.
