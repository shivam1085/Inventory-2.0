# Inventory 2.0 — Offline Auto-Parts Inventory + Billing (No Backend)

Offline-first single-page app for inventory management, billing, CSV/Excel import-export, and optional Google Sheets backup.

Branding: AJ Autoparts (Automotive Junction Autoparts)

- Works fully offline in the browser (IndexedDB)
- Manage products, stock in/out, low stock warnings
- Create printable invoices that automatically reduce stock
- Customers and suppliers management
- CSV import/export (built-in); .xlsx via optional SheetJS
- Optional Google Sheets backup/restore with OAuth2

## Files
- `index.html` — UI layout and views
- `style.css` — Modern black/white/silver theme
- `app.js` — All logic: IndexedDB, inventory, billing, CSV/.xlsx, Google Sheets

## Quick Start (Offline)
Just open `index.html` in your browser. Everything works offline using IndexedDB.

Demo data is added on first run (3 products, 2 customers, 2 suppliers).

## Optional: Run a local server (recommended for Google OAuth)
Some features, like Google OAuth, require serving from `http://localhost` instead of `file://`.

Windows PowerShell (from the repo root):

```powershell
# Option A: Python 3 built-in server
python -m http.server 5500 -d "D:\Dev\Inventory 2.0"
# Then open: http://localhost:5500/index.html

# Option B: Node (npx)
# Requires Node.js installed
npx serve "D:\Dev\Inventory 2.0" -l 5500
# Then open: http://localhost:5500/
```

## Inventory & Billing
- Inventory: Add/Edit/Delete products; Stock In/Out; low stock badge based on per-product or global threshold.
- Billing: Add line items, save invoice (reduces stock), print invoice. Customer can be “Walk-in” or chosen from saved customers.

## Day/Night Theme
- Toggle the moon/sun button in the header to switch themes. Preference persists.

## Settings
- Business name and invoice footer are printed on invoices.
- Brand Logo: upload a PNG/JPG in Settings; it is stored locally and printed on invoices.

## CSV / Excel import-export
- Buttons are under the Export/Import view.
- CSV format uses a header row and double-quoted values. You can roundtrip by exporting, editing in Excel, and re-importing as CSV.
- If [SheetJS](https://sheetjs.com/) is loaded (see below), .xlsx export/import is enabled.

### CSV columns by data type
Products (CSV header):
```
id,partNumber,name,supplier,cost,price,stock,lowThreshold,notes
```
Customers:
```
id,name,phone,email,address,taxId,notes
```
Suppliers:
```
id,name,phone,email,address,notes
```
Invoices (basic CSV only includes invoices; items require .xlsx or Sheets):
```
id,number,date,customerId,total
```

### Optional SheetJS (.xlsx)
To enable .xlsx import/export:
1. Download `xlsx.full.min.js` from SheetJS and place it at `vendor/xlsx.full.min.js`.
2. Add this line before `app.js` in `index.html`:
```html
<script src="vendor/xlsx.full.min.js"></script>
```
That’s it — the app will detect `window.XLSX` automatically.

## Optional Google Sheets Backup/Restore (Google Identity Services)
This is fully optional. All data remains local unless you sign in and choose to backup. The app now uses Google Identity Services (GIS), not the deprecated `gapi.auth2`.

### What it does
- Creates (or reuses) a Google Spreadsheet with sheets: `Products`, `Customers`, `Suppliers`, `Invoices`, `InvoiceItems`.
- Backup writes your current local data to these sheets.
- Restore reads from the spreadsheet and imports into local IndexedDB.

### Requirements
- A Google Cloud project with OAuth 2.0 Web Client Credentials.
- Serving the app via `http://localhost` (not `file://`).

### Setup Steps
1. Visit https://console.cloud.google.com/ and create a project.
2. Enable APIs: “Google Sheets API” and (optionally) “Google Drive API”.
3. Create OAuth consent screen (External or Internal) and publish to Testing or Production.
4. Create Credentials: OAuth Client ID → Web Application.
   - Authorized JavaScript origins: `http://localhost:5500` (adjust port if needed)
   - Authorized redirect URIs: `http://localhost:5500`
5. In `app.js`, set your credentials (GIS uses only the Client ID on the frontend). By default, the app requests only the Sheets scope:
```js
const GOOGLE = {
  API_KEY: '', // optional
  CLIENT_ID: 'YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com',
   SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
  DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
}
```
6. Start a local server (see Quick Start), open the app, go to the Sync tab:
   - Click “Load Google API” (loads Google API client + GIS)
   - Click “Sign In” (first time shows Google consent)
   - Click “Sync/Backup to Google Sheets” to create a spreadsheet and upload data
   - Optionally click “Restore/Import from Google Sheets” to pull data back down

Notes:
- The app stores the resulting `spreadsheetId` locally in IndexedDB settings for reuse.
- Permissions requested by default: `spreadsheets` (read/write Sheets). This is enough to create a new spreadsheet and read/write its data.
- If your organization allows it and you want Drive file access, change `SCOPES` to include Drive: `'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets'` and re-consent.
- If backup fails on first run, try again after ensuring you’re signed in and consent is completed.

### Troubleshooting Auth (GIS)
- Message: `Init failed: Cannot read properties of null (reading 'isSignedIn')`
   - Cause: Old error from deprecated `gapi.auth2`. The app now uses GIS. Ensure you reloaded after updating.
   - Fix: Provide a valid OAuth 2.0 Web Client ID (see step 4), serve from the authorized origin, click “Load Google API” again.
- Message: `You have created a new client application that uses libraries... deprecated`
   - Cause: Using `gapi.auth2` with a new client. The app is migrated to GIS; reload your page and make sure caching isn’t serving old code.
- Message: `popup_closed_by_user`
   - You closed the Google sign-in popup. Try again.
- Sign-in not showing: Ensure the Authorized JavaScript origin in Google Cloud matches your local server origin exactly (including port).

## Printing Invoices
- Use “Save Invoice” then “Print” in the invoices list, or “Print Invoice” for a draft (without saving).
- If a logo is uploaded in Settings, it appears next to the business name on the printout.
- Print styles target A4/Letter with a clean, simple layout.
## Desktop App (Electron)
You can run this as a desktop app on Windows using Electron.

Prerequisites: Node.js LTS installed

Install and run in dev:
```powershell
cd "D:\Dev\Inventory 2.0"
npm install
npm start
```

Build a Windows installer (NSIS):
```powershell
npm run pack:win
```
Find the installer in the `dist` folder (e.g., `AJ-Autoparts-Inventory-1.0.0-Setup-x64.exe`).

Icons:
- Add `icons/icon.ico` for the installer/app icon.
- Add PWA icons: `icons/icon-192.png`, `icons/icon-512.png`.
See `icons/README.txt` for details.

Code signing (optional):
- electron-builder supports Windows code signing via a .pfx certificate.
- Configure environment variables `CSC_LINK` and `CSC_KEY_PASSWORD`, or add signing options in `package.json` build config.
- Use the “Print Invoice” button after saving an invoice, or “Print” for a draft.
- Print styles hide the app chrome and format the invoice for A4/Letter.

### What persists / where data lives
The desktop version still uses the Chromium browser profile’s IndexedDB inside Electron. Each machine keeps its own local data store. To migrate data between PCs, export CSV / XLSX or use Google Sheets backup.

### Updating the desktop app
1. Pull latest changes (`git pull`).
2. Re-run `npm install` if dependencies changed.
3. Rebuild installer: `npm run pack:win`.
4. Run the new installer; one-click NSIS uninstall/upgrade will replace the previous version.

### Common desktop issues
- Blank window on start: Delete `%APPDATA%/AJ Autoparts Inventory` (settings cache) if corrupted.
- Google sign-in popup blocked: Ensure app window is focused; Electron allows popups by default.
- Camera/barcode not working: Electron may prompt for permission; restart if denied.
- Slow first launch: Electron unpacks app; subsequent launches are faster.

### Customizing build
Edit `package.json` > `build` section:
- `productName`: changes installer/window title.
- `appId`: unique identifier for Windows registry.
- Add `extraResources` if you later include external binaries.

For MSI or portable builds, adjust the `win.target` array (currently NSIS x64 + ia32).

## Data & Limits
- All data is stored locally in your browser’s IndexedDB. Clearing site data will remove it unless you export/sync.
- For large datasets, prefer IndexedDB (already used). CSV import handles quoted fields.

## Deploy to the Web (Desktop + Phone)
The app is a PWA and works great on phones when hosted over HTTPS.

### Option 1: GitHub Pages (free, HTTPS)
1. Create a new GitHub repository and push these files.
2. In repo Settings → Pages, set Source to `main` branch `/ (root)` and save.
3. Your site will be live at `https://<username>.github.io/<repo>/`.
4. Update Google OAuth (if using Sheets backup): add the site URL as an Authorized JavaScript Origin.
5. On your phone, open the URL → browser menu → Add to Home screen to install.

Note: `manifest.json` uses relative `start_url` and `scope` so it installs correctly on subpaths.

### Option 2: Netlify or Vercel (drag-and-drop, HTTPS)
- Drag the project folder into Netlify or deploy with Vercel. They provide HTTPS and a custom URL.
- Add that URL to Google OAuth Authorized JavaScript Origins for Sheets backup.

### Option 3: Local network testing on phone
```powershell
python -m http.server 5500 -d "D:\Dev\Inventory 2.0"
```
Then browse `http://<YOUR_PC_IP>:5500/` on your phone.

Notes:
- Camera/barcode scanning and Google Sign-In generally require HTTPS (secure context). For full features on phone, prefer Options 1 or 2, or use a tunnel (e.g., `npx localtunnel` or `ngrok`) to get an HTTPS URL to your local server.
- After deploying to HTTPS, you can install it as an app from the browser menu (PWA).

### Barcode scanning on mobile
- Modern Chrome/Edge/Android support BarcodeDetector.
- Fallback included: if the browser lacks BarcodeDetector (e.g., some iOS), the app loads ZXing from a CDN at runtime and continues scanning. This requires internet access the first time; afterward your PWA cache may keep it available.

## Troubleshooting
- Google Sign-In not appearing: Ensure you’re serving via `http://localhost` and the OAuth origin matches.
- Backup overwrites sheet data: This tool is designed for full snapshot backup; export regularly.
- CSV import fails: Check headers and data types. Try exporting first to get a template.
 - PWA not installable on your domain: Confirm HTTPS, valid `manifest.json`, and that `service-worker.js` is reachable.

## License
This app is provided as-is for business use. Replace branding in Settings as needed.
