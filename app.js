/*
  Inventory 2.0 – Offline Auto Parts App
  - Offline-first using IndexedDB
  - Inventory, Billing (stock reduces), Customers, Suppliers
  - CSV export/import built-in; optional SheetJS (.xlsx) if window.XLSX exists
  - Optional Google Sheets backup/restore via OAuth2 (gapi)
  - All UI in single page; modern black/white/silver theme

  Note: For Google OAuth to work, serve this app via http://localhost using a static server.
*/

;(() => {
  const qs = (s, el=document) => el.querySelector(s)
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s))

  // Embedded default logo (base64 PNG)
  const DEFAULT_LOGO_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO8AAAC9CAYAAABbNipFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAADLLY2FCWAAAMstqdW1iAAAAHmp1bWRjMnBhABEAEIAAAKoAOJtxA2MycGEAAAAypWp1bWIAAABHanVtZGMybWEAEQAQgAAAqgA4m3EDdXJuOnV1aWQ6ODllMGZkZjEtN2QyYy00OWJhLTliMjItYjllNWVjNmQ0Yjk3AAAAAtJqdW1iAAAAKWp1bWRjMmFzABEAEIAAAKoAOJtxA2MycGEuYXNzZXJ0aW9ucwAAAAG7anVtYgAAAClqdW1kY2JvcgARABCAAACqADibcQNjMnBhLmhhc2guYm94ZXMAAAABimNib3KiY2FsZ2ZzaGEyNTZlYm94ZXOHo2VuYW1lc4FkUE5HaGRoYXNoWCBMS2o74TFKuGE4vvQxTd4CLmAJYNhomiyPhjGALSDatmNwYWRAo2VuYW1lc4FkSUhEUmRoYXNoWCBUNJl1hm833DKJn6uCFl3G9vB/0avb6GWlaENVAgI2JWNwYWRAo2VuYW1lc4Fkc1JHQmRoYXNoWCBzJsP7+1+aQ3Hvh9pzmOYej4n7bzMGrSmcalK4aULtSWNwYWRAo2VuYW1lc4FkZ0FNQWRoYXNoWCA4rXegkiHP9x5cpXUzPldt5x4AB/TTcAg9gAXc4VAX1WNwYWRAo2VuYW1lc4FkQzJQQWRoYXNoQQBjcGFkQKNlbmFtZXOBZElEQVRkaGFzaFggbHa7z28aoJBUNXqevwTMLjy/PxAE64o4m3/qI6jRJlhjcGFkQKNlbmFtZXOBZElFTkRkaGFzaFgggZ5y7wBQZ2uGFgtvvQs5tH+7E6jhDmnCmcvhrYSNI99jcGFkQAAAAKNqdW1iAAAALGp1bWRjYm9yABEAEIAAAKoAOJtxA2MycGEuaW5ncmVkaWVudC52MgAAAABvY2JvcqNoZGM6dGl0bGV4LmFzc2V0LTNjZGI1ODBkLTRkZDUtNDQ2My05ZWMyLTg2Y2NlMTQ5MGY3Zi5wbmdpZGM6Zm9ybWF0aWltYWdlL3BuZ2xyZWxhdGlvbnNoaXBrY29tcG9uZW50T2YAAABDanVtYgAAAClqdW1kY2JvcgARABCAAACqADibcQNjMnBhLmFjdGlvbnMudjIAAAAAEmNib3KhZ2FjdGlvbnOAAAADdWp1bWIAAAAkanVtZGMyY2wAEQAQgAAAqgA4m3EDYzJwYS5jbGFpbQAAAANJY2JvcqdjYWxnZnNoYTI1NmlkYzpmb3JtYXRpaW1hZ2UvcG5naXNpZ25hdHVyZXhMc2VsZiNqdW1iZj1jMnBhL3Vybjp1dWlkOjg5ZTBmZGYxLTdkMmMtNDliYS05YjIyLWI5ZTVlYzZkNGI5Ny9jMnBhLnNpZ25hdHVyZWppbnN0YW5jZUlEeC11cm46dXVpZDplNjkwNWJmZi0wNTU2LTQ1OTctOWQ0MC00MzE0MTI0YjQ1Y2VvY2xhaW1fZ2VuZXJhdG9ydk1pY3Jvc29mdF9EZXNpZ25lci8xLjB0Y2xhaW1fZ2VuZXJhdG9yX2luZm+BpGVhcHBJZHgkNWUyNzk1ZTMtY2U4Yy00Y2ZiLWIzMDItMzVmZTVjZDAxNTk3ZG5hbWVyTWljcm9zb2Z0X0Rlc2lnbmVyaXJlcXVlc3RJZHgkNDg0YTRhYzMtYjc3Ni00YWRmLWI0MzQtNzQ2OWU0Nzc5N2YwZ3ZlcnNpb25jMS4wamFzc2VydGlvbnODo2NhbGdmc2hhMjU2Y3VybHhdc2VsZiNqdW1iZj1jMnBhL3Vybjp1dWlkOjg5ZTBmZGYxLTdkMmMtNDliYS05YjIyLWI5ZTVlYzZkNGI5Ny9jMnBhLmFzc2VydGlvbnMvYzJwYS5oYXNoLmJveGVzZGhhc2hYIN1zRgtyEAcy/T0i7bIpg2TiISf0vLzBO+B+6e9CQr/Jo2NhbGdmc2hhMjU2Y3VybHhgc2VsZiNqdW1iZj1jMnBhL3Vybjp1dWlkOjg5ZTBmZGYxLTdkMmMtNDliYS05YjIyLWI5ZTVlYzZkNGI5Ny9jMnBhLmFzc2VydGlvbnMvYzJwYS5pbmdyZWRpZW50LnYyZGhhc2hYILEH838V1hCg2YTx5NFX6obkkyNt/TodTxf3WzatGq/Lo2NhbGdmc2hhMjU2Y3VybHhdc2VsZiNqdW1iZj1jMnBhL3Vybjp1dWlkOjg5ZTBmZGYxLTdkMmMtNDliYS05YjIyLWI5ZTVlYzZkNGI5Ny9jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYIC1yt0odH0wiUSTHfAdNepNapPqQGp6nZAsg5MyVyUQZAAAsD2p1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAAr32Nib3LShEShATgkomd4NWNoYWlug1kGKTCCBiUwggQNoAMCAQICEzMAAACIY3ezD2+nm1kAAAAAAIgwDQYJKoZIhvcNAQEMBQAwVjELMAkGA1UEBhMCVVMxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEnMCUGA1UEAxMeTWljcm9zb2Z0IFNDRCBDbGFpbWFudHMgUlNBIENBMB4XDTI1MTAwMTE3NDQxNFoXDTI2MTAwMTE3NDQxNFowdDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAiQFGKuvVnZnkmLihFVLczdJRR51a/yeeDzGntyelB6KCc+fdXizQGuXSE3Gs1ym9ubwGKgkRHarePP2oK73GswK/LvW6pE2BURGvwhfqzf/HjPRC8aqfXb4yMVS2m3cXxjEMN0O1BMSlk4XlDDFYFfjhvc+9zAgTPfAWDd03HSho/bIZVtloXilovzMBjvUqyf79P5agc8GhdIuyrcKDo9+UasrVD2/vjBuGKkiRjKJZ5pwd0XVbAGjAXjkzjqyFW420qPSz07e+Kl6njaAEcz0BGOwPwVoVRac6D/PW9yQWQ6ipcMeqYVSpYnnAn8TZdOjZInqBOgVN+zVqXeJLAkpO/QUlmPPsn86e00BT61AdbJju/hSunoWkrfMRP1MCuasNZPgnTsz994KbwxfejHzyMhayU+Xy0SiWRybPoRAIMcP2Oy6T24xgGQMGTPxdU4ueTO7mbvhgDLI98SNKrU4eFDGgCv1FHfKNp9NXQ9QNLaBYiHvCKeeXBEvN3nM9AgMBAAGjggFMMIIBSDAZBgNVHSUBAf8EDzANBgsrBgEEAYI3TDsBCTAOBgNVHQ8BAf8EBAMCAMAwHQYDVR0OBBYEFJ+5ijiYRMf6YAt9jNQQFQb53ustMB8GA1UdIwQYMBaAFIutmvyPdc3ODY1prXxMpGBW2bREMF8GA1UdHwRYMFYwVKBSoFCGTmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFNDRCUyMENsYWltYW50cyUyMFJTQSUyMENBLmNybDBsBggrBgEFBQcBAQRgMF4wXAYIKwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwU0NEJTIwQ2xhaW1hbnRzJTIwUlNBJTIwQ0EuY3J0MAwGA1UdEwEB/wQCMAAwDQYJKoZIhvcNAQEMBQADggIBAA27WLgqEbbCCb/dBjogKVTMk5QF96r62ct6eJfBRyySLJJBgyoX16dSBzboxxHjGWQjdFhtskTk4zcIdtR0AIUhhZcREvyIDPJmnOiiXTdl9SJpquYqe8T20RDmhKS+pAuoC2BQQuF7puYvfYskCDHu2Y2Iy2hVwO0Hk/Eu9I4eAjYUD8xvb0igiFS8v3l1uNX6593PDkODepxWj2Sdm/B4hpkpsp3TSFL4vwfVg+PLnwNYGqpZEODqLMJMix7QeZKeXrILHSez20nC/RjudxrzjxTFczhkn3XL45sIRZbcyoUkh093ZAGS73eWae8vVI4jymn4Y/6kTopzrF+HV0Jy5SUWpAzPwQ4Ur1PLMp2LpktyM2K8km1jpeELUeUArkiVb4HbiWCcSJlerOjeRIhh8ZG4snIQrAPdPECCu2T6y3KL4PRugOsYl+rY/8lohZY9UwcBqpDxJblahJ4Dcxj7VnCguUrCnht1r31rlsEOnBVHBT3jMEuDYsfIEqAxvz+UhYcmQh7iAGxGjkWVkjVaoByT1o0bYROh2dMURBJzyJ6xuNQk2uvFOLUG2H6pSmfOhYKMuBUIKvMp++HrZ4TiJxqfXaKv7R2xSSqvWx/XXx0b3sfwnXDHfARfxs8HGncShfjDGMs0AWuaZPDFVHv8AAgtPnLL42lzIdfZcw6zWQbW';

  const state = {
    db: null,
    products: [],
    customers: [],
    suppliers: [],
    invoices: [],
    invoiceItems: [],
    settings: { lowStockThreshold: 5, businessName: 'Automotive Junction Autoparts', invoiceFooter: 'Thank you for your business!', theme: 'dark', logoDataUrl: DEFAULT_LOGO_DATA_URL },
    bill: { lines: [], customerId: null, date: todayStr(), number: '' },
    gapiLoaded: false,
    gapiAuthed: false,
    spreadsheetId: null,
    userEmail: null,
    tokenClient: null,
    accessToken: null,
    isAuthenticated: false,
  }

  // Simple static auth (change these credentials)
  const AUTH = {
    username: 'AJadmin',
    password: 'AJadmin123'
  }

  function todayStr(){
    const d = new Date();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${day}`
  }

  // ---------- IndexedDB minimal wrapper ----------
  const DB_NAME = 'inventory2';
  const DB_VER = 2;
  const STORES = {
    products: 'products',
    customers: 'customers',
    suppliers: 'suppliers',
    invoices: 'invoices',
    invoiceItems: 'invoiceItems',
    settings: 'settings'
  }

  function openDB(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER)
      req.onupgradeneeded = (e) => {
        const db = req.result
        // products
        let ps
        if(!db.objectStoreNames.contains('products')){
          ps = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
        } else {
          ps = req.transaction.objectStore('products')
        }
        if(ps){
          if(!ps.indexNames.contains('by_partNumber')) ps.createIndex('by_partNumber', 'partNumber', { unique: true })
          if(!ps.indexNames.contains('by_name')) ps.createIndex('by_name', 'name', { unique: false })
        }

        // customers
        if(!db.objectStoreNames.contains('customers')){
          db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
        }
        // suppliers
        if(!db.objectStoreNames.contains('suppliers')){
          db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true })
        }
        // invoices
        let invs
        if(!db.objectStoreNames.contains('invoices')){
          invs = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true })
        } else {
          invs = req.transaction.objectStore('invoices')
        }
        if(invs){
          if(!invs.indexNames.contains('by_number')) invs.createIndex('by_number', 'number', { unique: false })
          if(!invs.indexNames.contains('by_date')) invs.createIndex('by_date', 'date', { unique: false })
        }
        // invoiceItems
        let items
        if(!db.objectStoreNames.contains('invoiceItems')){
          items = db.createObjectStore('invoiceItems', { keyPath: 'id', autoIncrement: true })
        } else {
          items = req.transaction.objectStore('invoiceItems')
        }
        if(items){
          if(!items.indexNames.contains('by_invoiceId')) items.createIndex('by_invoiceId', 'invoiceId', { unique: false })
        }
        // settings
        if(!db.objectStoreNames.contains('settings')){
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  function tx(stores, mode='readonly'){
    return state.db.transaction(stores, mode)
  }

  function getAll(store){
    return new Promise(async (resolve, reject) => {
      try{
        await ensureDB()
        const req = tx(store).objectStore(store).getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => { console.error('IndexedDB getAll error', store, req.error); reject(req.error) }
      }catch(e){ console.error('IndexedDB getAll exception', store, e); reject(e) }
    })
  }

  function add(store, value){
    return new Promise(async (resolve, reject) => {
      try{
        await ensureDB()
        const req = tx(store, 'readwrite').objectStore(store).add(value)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => { console.error('IndexedDB add error', store, value, req.error); reject(req.error) }
      }catch(e){ console.error('IndexedDB add exception', store, value, e); reject(e) }
    })
  }

  function put(store, value){
    return new Promise(async (resolve, reject) => {
      try{
        await ensureDB()
        const req = tx(store, 'readwrite').objectStore(store).put(value)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => { console.error('IndexedDB put error', store, value, req.error); reject(req.error) }
      }catch(e){ console.error('IndexedDB put exception', store, value, e); reject(e) }
    })
  }

  function del(store, key){
    return new Promise(async (resolve, reject) => {
      try{
        await ensureDB()
        const req = tx(store, 'readwrite').objectStore(store).delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      }catch(e){ reject(e) }
    })
  }

  async function ensureDB(){
    if(!state.db){
      try{
        state.db = await openDB()
        console.log('[DB] Opened lazily')
      }catch(e){ console.error('[DB] Failed to open', e); throw e }
    }
  }

  function getByIndex(store, indexName, query){
    return new Promise(async (resolve, reject) => {
      try{
        await ensureDB()
        const os = tx(store).objectStore(store)
        const idx = os.index(indexName)
        const req = idx.get(query)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      }catch(e){ reject(e) }
    })
  }

  async function saveSetting(key, value){
    await put(STORES.settings, { key, value })
    state.settings[key] = value
  }

  async function loadSettings(){
    const all = await getAll(STORES.settings)
    const s = { ...state.settings }
    for(const kv of all){ s[kv.key] = kv.value }
    state.settings = s
    if(s.spreadsheetId) state.spreadsheetId = s.spreadsheetId
    applyTheme(s.theme||'dark')
  }

  // ---------- Seed demo data ----------
  async function seedIfEmpty(){
    const [prods, custs, supps] = await Promise.all([
      getAll(STORES.products), getAll(STORES.customers), getAll(STORES.suppliers)
    ])
    if(prods.length || custs.length || supps.length) return

    const suppliers = [
      { name: 'SilverLine Supplies', phone:'', email:'', address:'', notes:'' },
      { name: 'Midnight Motors', phone:'', email:'', address:'', notes:'' },
    ]
    for(const s of suppliers) await add(STORES.suppliers, s)

    const products = [
      { partNumber:'BRK-123', name:'Brake Pad Set', supplier:'SilverLine Supplies', cost:20, price:35, stock:25, lowThreshold:5, notes:'' },
      { partNumber:'FLT-456', name:'Oil Filter', supplier:'Midnight Motors', cost:5, price:9.5, stock:50, lowThreshold:10, notes:'' },
      { partNumber:'SPK-789', name:'Spark Plug', supplier:'SilverLine Supplies', cost:3, price:6.5, stock:12, lowThreshold:5, notes:'' },
    ]
    for(const p of products) await add(STORES.products, p)

    const customers = [
      { name:'John Doe', phone:'555-0100', email:'', address:'', taxId:'', notes:'' },
      { name:'Acme Auto', phone:'555-0101', email:'', address:'', taxId:'', notes:'' },
    ]
    for(const c of customers) await add(STORES.customers, c)

    await saveSetting('lowStockThreshold', 5)
    await saveSetting('businessName', 'Automotive Junction Autoparts')
    await saveSetting('invoiceFooter', 'Thank you for your business!')
  }

  // ---------- Load all data ----------
  async function loadAll(){
    const [products, customers, suppliers, invoices, invoiceItems] = await Promise.all([
      getAll(STORES.products), getAll(STORES.customers), getAll(STORES.suppliers), getAll(STORES.invoices), getAll(STORES.invoiceItems)
    ])
    state.products = products
    state.customers = customers
    state.suppliers = suppliers
    state.invoices = invoices.sort((a,b)=> (b.id||0)-(a.id||0))
    state.invoiceItems = invoiceItems
  }

  // ---------- Helpers ----------
  function fmt(n){ return (Number(n)||0).toFixed(2) }

  function findProductByPart(part){
    const p = state.products.find(x => x.partNumber.toLowerCase() === String(part).toLowerCase())
    return p || null
  }

  // Abbreviated business name for receipts (avoid long full name)
  function receiptBusinessName(){
    const name = state.settings.businessName || 'Invoice'
    if(name.trim() === 'Automotive Junction Autoparts') return 'AJ Autoparts'
    if(name.length > 30){
      const words = name.split(/\s+/).filter(Boolean)
      if(words.length >= 2){
        const abbrev = words[0][0] + words[1][0]
        const tail = words.slice(2).join(' ')
        return tail ? (abbrev + ' ' + tail) : abbrev
      }
    }
    return name
  }

  function productToRow(p){
    const lowT = (p.lowThreshold ?? state.settings.lowStockThreshold) || 0
    const isLow = (p.stock||0) <= lowT
    return `<tr data-id="${p.id}" class="${isLow?'low':''}">
      <td>${escapeHtml(p.partNumber)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.supplier||'')}</td>
      <td>${fmt(p.cost)}</td>
      <td>${fmt(p.price)}</td>
      <td>${p.stock||0}</td>
      <td>${isLow?'<span class="badge warn">Low</span>':''}</td>
      <td>
        <button class="ghost" data-act="edit">Edit</button>
        <button class="danger" data-act="del">Delete</button>
      </td>
    </tr>`
  }

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
  }

  // ---------- Inventory UI ----------
  function renderInventory(list=state.products){
    console.log('[Render] renderInventory called, state.products.length:', state.products.length)
    const q = qs('#inv-search').value.trim().toLowerCase()
    const rows = list.filter(p => !q || [p.partNumber,p.name,p.supplier].join(' ').toLowerCase().includes(q))
    console.log('[Render] Filtered rows:', rows.length, 'search query:', q)
    const html = rows.map(productToRow).join('')
    console.log('[Render] Generated HTML length:', html.length)
    const tbody = qs('#tbl-products tbody')
    console.log('[Render] tbody element:', tbody ? 'FOUND' : 'NULL')
    if(tbody) {
      tbody.innerHTML = html
      console.log('[Render] tbody.innerHTML set, children count:', tbody.children.length)
    }
    qs('#stat-products').textContent = `${state.products.length} products`
    const lowCount = state.products.filter(p => (p.stock||0) <= ((p.lowThreshold ?? state.settings.lowStockThreshold) || 0)).length
    qs('#stat-lowstock').textContent = `${lowCount} low stock`

    // datalists
    const pl = qs('#product-list')
    pl.innerHTML = state.products.map(p => `<option value="${escapeHtml(p.partNumber)}">${escapeHtml(p.name)}</option>`).join('')
    const sl = qs('#supplier-list')
    const su = [...new Set(state.suppliers.map(s => s.name).filter(Boolean))]
    sl.innerHTML = su.map(n => `<option value="${escapeHtml(n)}"></option>`).join('')
  }

  function openProductDialog(p){
    console.log('[ProductDialog] Opening', p ? 'EDIT' : 'ADD', p)
    const dlg = qs('#dlg-product')
    qs('#dlg-product-title').textContent = p? 'Edit Product' : 'Add Product'
    qs('#product-id').value = p?.id || ''
    qs('#product-partNumber').value = p?.partNumber || ''
    qs('#product-name').value = p?.name || ''
    qs('#product-supplier').value = p?.supplier || ''
    qs('#product-stock').value = p?.stock ?? 0
    qs('#product-cost').value = p?.cost ?? 0
    qs('#product-price').value = p?.price ?? 0
    qs('#product-lowThreshold').value = p?.lowThreshold ?? ''
    qs('#product-notes').value = p?.notes || ''
    dlg.showModal()
    console.log('[ProductDialog] Dialog shown')
  }

  async function saveProductFromDialog(){
    const id = Number(qs('#product-id').value)||null
    const p = {
      id: id||undefined,
      partNumber: qs('#product-partNumber').value.trim(),
      name: qs('#product-name').value.trim(),
      supplier: qs('#product-supplier').value.trim(),
      stock: Number(qs('#product-stock').value)||0,
      cost: Number(qs('#product-cost').value)||0,
      price: Number(qs('#product-price').value)||0,
      lowThreshold: qs('#product-lowThreshold').value ? Number(qs('#product-lowThreshold').value) : undefined,
      notes: qs('#product-notes').value.trim(),
    }
    if(!p.partNumber || !p.name){ alert('Part number and Name are required.'); return }
    try{
      await ensureDB()
      console.log('[Product] Saving', p)
      // Uniqueness pre-check to give friendlier message than generic constraint
      let existing = null
      try{
        existing = await getByIndex(STORES.products, 'by_partNumber', p.partNumber)
      }catch(_){
        // Fallback if index missing (older DB): scan all
        const all = await getAll(STORES.products)
        existing = all.find(r => String(r.partNumber||'').toLowerCase() === p.partNumber.toLowerCase()) || null
      }
      if(existing && existing.id !== id){
        alert('Part Number already exists. Please edit the existing product or choose a different Part Number.')
        return
      }
      if(id){
        await put(STORES.products, p)
      } else {
        const toAdd = { ...p }
        delete toAdd.id
        p.id = await add(STORES.products, toAdd)
      }
      console.log('[Product] Saved with id', p.id)
    }catch(e){
      console.error('Product save error', e)
      const msg = e?.name === 'ConstraintError'
        ? 'Part Number already exists.'
        : 'Save failed: ' + (e?.message || e)
      alert(msg)
      return
    }
    console.log('[Product] Clearing search and reloading...')
    // Clear search so the new item isn't hidden by filters
    const invSearch = qs('#inv-search'); if(invSearch) invSearch.value = ''
    await reloadProducts()
    console.log('[Product] Activating inventory view...')
    if(typeof activateView === 'function') activateView('inventory')
    // Try to bring the saved row into view
    setTimeout(()=>{
      const tr = qs(`#tbl-products tbody tr[data-id="${p.id}"]`)
      if(tr){ 
        console.log('[Product] Scrolling to new row', p.id)
        tr.scrollIntoView({ block:'center' })
      } else {
        console.warn('[Product] Could not find row for id', p.id)
      }
    }, 50)
  }

  async function reloadProducts(){
    try{
      await ensureDB()
      state.products = await getAll(STORES.products)
      console.log('[Product] Reloaded list, count', state.products.length, 'items:', state.products.map(p => p.partNumber))
    }catch(e){ console.error('Reload products failed', e) }
    renderInventory()
    console.log('[Product] renderInventory completed')
  }

  async function applyStock(delta){
    const part = qs('#stock-partNumber').value.trim()
    const qty = Number(qs('#stock-quantity').value)||0
    if(!part || !qty){ alert('Part and quantity required.'); return }
    const p = findProductByPart(part)
    if(!p){ alert('Product not found.'); return }
    const newStock = (p.stock||0) + delta*qty
    if(newStock < 0){ alert('Insufficient stock.'); return }
    p.stock = newStock
    await put(STORES.products, p)
    renderInventory()
  }

  // ---------- Customers & Suppliers UI ----------
  function renderCustomers(){
    const q = qs('#cust-search').value.trim().toLowerCase()
    const rows = state.customers.filter(c => !q || [c.name,c.phone,c.email].join(' ').toLowerCase().includes(q))
    qs('#tbl-customers tbody').innerHTML = rows.map(c => `
      <tr data-id="${c.id}">
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone||'')}</td>
        <td>${escapeHtml(c.email||'')}</td>
        <td>${escapeHtml(c.address||'')}</td>
        <td>
          <button class="ghost" data-act="edit">Edit</button>
          <button class="danger" data-act="del">Delete</button>
        </td>
      </tr>`).join('')
    
    const sel = qs('#bill-customer')
    sel.innerHTML = '<option value="">Walk-in</option>' + state.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')
  }

  function openCustomerDialog(c){
    qs('#dlg-customer-title').textContent = c? 'Edit Customer':'Add Customer'
    qs('#customer-id').value = c?.id||''
    qs('#customer-name').value = c?.name||''
    qs('#customer-phone').value = c?.phone||''
    qs('#customer-email').value = c?.email||''
    qs('#customer-address').value = c?.address||''
    qs('#customer-taxId').value = c?.taxId||''
    qs('#customer-notes').value = c?.notes||''
    qs('#dlg-customer').showModal()
  }

  async function saveCustomerFromDialog(){
    console.log('[Customer] Saving...')
    const id = Number(qs('#customer-id').value)||null
    const c = {
      name: qs('#customer-name').value.trim(),
      phone: qs('#customer-phone').value.trim(),
      email: qs('#customer-email').value.trim(),
      address: qs('#customer-address').value.trim(),
      taxId: qs('#customer-taxId').value.trim(),
      notes: qs('#customer-notes').value.trim(),
    }
    if(!c.name){ alert('Name required'); return }
    console.log('[Customer] Data:', c)
    try{
      await ensureDB()
      if(id){ 
        c.id = id
        await put(STORES.customers, c)
        console.log('[Customer] Updated id:', id)
      } else { 
        const newId = await add(STORES.customers, c)
        c.id = newId
        console.log('[Customer] Added with id:', c.id)
      }
    }catch(e){ console.error('Customer save error', e); alert('Failed to save customer'); return }
    // Clear search so new entry is visible
    const cs = qs('#cust-search'); if(cs) cs.value = ''
    // Refresh list from DB to avoid stale state
    console.log('[Customer] Reloading from DB...')
    try{ state.customers = await getAll(STORES.customers) }catch(e){ console.error('[Customer] Reload failed', e) }
    console.log('[Customer] Count:', state.customers.length)
    renderCustomers()
    console.log('[Customer] Save completed')
  }

  function renderSuppliers(){
    const q = qs('#supp-search').value.trim().toLowerCase()
    const rows = state.suppliers.filter(s => !q || [s.name,s.phone,s.email].join(' ').toLowerCase().includes(q))
    qs('#tbl-suppliers tbody').innerHTML = rows.map(s => `
      <tr data-id="${s.id}">
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.phone||'')}</td>
        <td>${escapeHtml(s.email||'')}</td>
        <td>${escapeHtml(s.address||'')}</td>
        <td>
          <button class="ghost" data-act="edit">Edit</button>
          <button class="danger" data-act="del">Delete</button>
        </td>
      </tr>`).join('')
    renderInventory() // update datalist
  }

  function openSupplierDialog(s){
    qs('#dlg-supplier-title').textContent = s? 'Edit Supplier':'Add Supplier'
    qs('#supplier-id').value = s?.id||''
    qs('#supplier-name').value = s?.name||''
    qs('#supplier-phone').value = s?.phone||''
    qs('#supplier-email').value = s?.email||''
    qs('#supplier-address').value = s?.address||''
    qs('#supplier-notes').value = s?.notes||''
    qs('#dlg-supplier').showModal()
  }

  async function saveSupplierFromDialog(){
    console.log('[Supplier] Saving...')
    const id = Number(qs('#supplier-id').value)||null
    const s = {
      name: qs('#supplier-name').value.trim(),
      phone: qs('#supplier-phone').value.trim(),
      email: qs('#supplier-email').value.trim(),
      address: qs('#supplier-address').value.trim(),
      notes: qs('#supplier-notes').value.trim(),
    }
    if(!s.name){ alert('Name required'); return }
    console.log('[Supplier] Data:', s)
    try{
      await ensureDB()
      if(id){ 
        s.id = id
        await put(STORES.suppliers, s)
        console.log('[Supplier] Updated id:', id)
      } else { 
        const newId = await add(STORES.suppliers, s)
        s.id = newId
        console.log('[Supplier] Added with id:', s.id)
      }
    }catch(e){ console.error('Supplier save error', e); alert('Failed to save supplier'); return }
    const ss = qs('#supp-search'); if(ss) ss.value = ''
    console.log('[Supplier] Reloading from DB...')
    try{ state.suppliers = await getAll(STORES.suppliers) }catch(e){ console.error('[Supplier] Reload failed', e) }
    console.log('[Supplier] Count:', state.suppliers.length)
    renderSuppliers()
    console.log('[Supplier] Save completed')
  }

  // ---------- Billing ----------
  function resetBill(){
    state.bill = { lines: [], customerId: null, date: todayStr(), number: '' }
    qs('#bill-date').value = state.bill.date
    qs('#bill-number').value = ''
    qs('#bill-product').value = ''
    qs('#bill-qty').value = 1
    qs('#bill-price').value = ''
    updateBillTable()
  }

  function updateBillTable(){
    const tbody = qs('#tbl-bill-lines tbody')
    const rows = state.bill.lines.map((ln,i) => {
      const total = ln.qty * ln.price
      return `<tr data-i="${i}">
        <td>${escapeHtml(ln.partNumber)}</td>
        <td>${escapeHtml(ln.name)}</td>
        <td>${ln.qty}</td>
        <td>${fmt(ln.price)}</td>
        <td>${fmt(total)}</td>
        <td><button class="danger" data-act="rm-line">Remove</button></td>
      </tr>`
    })
    tbody.innerHTML = rows.join('')
    const subtotal = state.bill.lines.reduce((s,ln)=> s + ln.qty*ln.price, 0)
    qs('#bill-subtotal').textContent = fmt(subtotal)
    const tax = 0
    qs('#bill-tax').textContent = fmt(tax)
    qs('#bill-total').textContent = fmt(subtotal + tax)
  }

  function addBillLine(){
    const prodInput = qs('#bill-product').value.trim()
    if(!prodInput){ alert('Select a product'); return }
    let p = findProductByPart(prodInput)
    if(!p){ // allow match by name
      p = state.products.find(x => x.name.toLowerCase() === prodInput.toLowerCase())
    }
    if(!p){ alert('Product not found'); return }
    const qty = Number(qs('#bill-qty').value)||1
    if(qty<=0){ alert('Invalid quantity'); return }
    const price = Number(qs('#bill-price').value)||p.price||0
    state.bill.lines.push({ productId:p.id, partNumber:p.partNumber, name:p.name, qty, price })
    qs('#bill-product').value = ''
    qs('#bill-qty').value = 1
    qs('#bill-price').value = ''
    updateBillTable()
  }
  async function saveInvoice(){
    if(!state.bill.lines.length){ alert('No items'); return }
    const customerId = Number(qs('#bill-customer').value)||null
    const date = qs('#bill-date').value || todayStr()
    const number = qs('#bill-number').value.trim() || `INV-${Date.now().toString().slice(-6)}`
    for(const ln of state.bill.lines){
      const p = state.products.find(pp=>pp.id===ln.productId)
      if(!p || (p.stock||0) < ln.qty){
        alert(`Insufficient stock for ${ln.partNumber}`)
        return
      }
    }
    const inv = { number, date, customerId, total: state.bill.lines.reduce((s,ln)=> s + ln.qty*ln.price, 0) }
    inv.id = await add(STORES.invoices, inv)
    for(const ln of state.bill.lines){
      const item = { invoiceId: inv.id, productId: ln.productId, partNumber: ln.partNumber, name: ln.name, qty: ln.qty, price: ln.price }
      item.id = await add(STORES.invoiceItems, item)
      state.invoiceItems.push(item)
      const p = state.products.find(pp=>pp.id===ln.productId)
      p.stock = (p.stock||0) - ln.qty
      await put(STORES.products, p)
    }
    state.invoices.unshift({ ...inv })
    renderInvoices()
    renderInventory()
    alert('Invoice saved')
    resetBill()
  }

  function renderInvoices(){
    qs('#stat-invoices').textContent = `${state.invoices.length} invoices`
    const tbody = qs('#tbl-invoices tbody')
    const rows = state.invoices.slice(0,50).map(inv => {
      const items = state.invoiceItems.filter(it => it.invoiceId === inv.id)
      return `<tr data-id="${inv.id}">
        <td>${escapeHtml(inv.number)}</td>
        <td>${escapeHtml(inv.date)}</td>
        <td>${escapeHtml(state.customers.find(c=>c.id===inv.customerId)?.name || 'Walk-in')}</td>
        <td>${items.length}</td>
        <td>${fmt(inv.total)}</td>
        <td><button class="ghost" data-act="print">Print</button></td>
      </tr>`
    })
    tbody.innerHTML = rows.join('')
  }

  function printInvoice(invId){
    const inv = state.invoices.find(i=>i.id===invId)
    if(!inv){ alert('Invoice not found'); return }
    const items = state.invoiceItems.filter(it=>it.invoiceId===inv.id)
    const cust = state.customers.find(c=>c.id===inv.customerId)
    const logo = state.settings.logoDataUrl ? `<img src="${state.settings.logoDataUrl}" alt="Logo" style="height:60px; margin-right:16px" />` : ''
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${inv.number}</title>
      <style>
        body{font-family:Segoe UI, Arial; padding:24px}
        h1{margin:0}
        .head{display:flex; align-items:center; gap:16px; margin-bottom:4px}
        .muted{color:#666}
        table{width:100%; border-collapse:collapse; margin-top:16px}
        th,td{border-bottom:1px solid #ddd; padding:8px; text-align:left}
        tfoot td{font-weight:700}
      </style></head><body>
      <div class="head">${logo}<h1>${escapeHtml(receiptBusinessName())}</h1></div>
      <div class="muted">Invoice # ${escapeHtml(inv.number)} · ${escapeHtml(inv.date)}</div>
      <div style="margin-top:12px">
        <div><strong>Bill To:</strong> ${escapeHtml(cust?.name || 'Walk-in')}</div>
        ${cust?.address? `<div>${escapeHtml(cust.address)}</div>`:''}
        ${cust?.phone? `<div>${escapeHtml(cust.phone)}</div>`:''}
      </div>
      <table><thead><tr><th>Part #</th><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
        ${items.map(it=>`<tr><td>${escapeHtml(it.partNumber)}</td><td>${escapeHtml(it.name)}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty*it.price)}</td></tr>`).join('')}
      </tbody><tfoot>
        <tr><td colspan="4" style="text-align:right">Grand Total</td><td>${fmt(inv.total)}</td></tr>
      </tfoot></table>
      <div style="margin-top:24px;">${escapeHtml(state.settings.invoiceFooter||'')}</div>
      <script>setTimeout(()=>window.print(), 100)</script>
    </body></html>`
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  // ---------- CSV / SheetJS ----------
  function toCSV(rows){
    if(!rows.length) return ''
    const cols = Object.keys(rows[0])
    const esc = v => '"'+String(v??'').replace(/"/g,'""')+'"'
    const header = cols.map(esc).join(',')
    const body = rows.map(r => cols.map(k => esc(r[k])).join(',')).join('\n')
    return header + '\n' + body
  }
  function download(filename, data, type='text/csv'){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], {type})); a.download = filename; a.click(); URL.revokeObjectURL(a.href) }
  function fromCSV(text){
    // Very small CSV parser supporting quotes
    const rows = []
    let i=0, cur='', row=[], inQ=false
    const pushCell = ()=>{ row.push(cur); cur='' }
    const pushRow = ()=>{ rows.push(row); row=[] }
    while(i<text.length){
      const ch = text[i++]
      if(inQ){
        if(ch==='"'){
          if(text[i]==='"'){ cur+='"'; i++ } else { inQ=false }
        } else cur+=ch
      } else {
        if(ch==='"') inQ=true
        else if(ch===','){ pushCell() }
        else if(ch==='\n'){ pushCell(); pushRow() }
        else if(ch==='\r') { /* skip */ }
        else cur+=ch
      }
    }
    if(cur!=='' || row.length) { pushCell(); pushRow() }
    const [header, ...body] = rows
    if(!header) return []
    return body.filter(r=>r.length===header.length && r.some(v=>v!=='')).map(r => Object.fromEntries(header.map((h,idx)=>[h.replace(/^\uFEFF/,''), r[idx]])))
  }

  async function exportData(kind){
    let data=[]
    if(kind==='products') data = state.products
    if(kind==='customers') data = state.customers
    if(kind==='suppliers') data = state.suppliers
    if(kind==='invoices'){
      // flatten invoices + items to two sheets if XLSX; else CSV invoices only
      const inv = state.invoices.map(i=> ({ id:i.id, number:i.number, date:i.date, customerId:i.customerId??'', total:i.total }))
      if(window.XLSX){
        const items = state.invoiceItems.map(it=> ({ id:it.id, invoiceId:it.invoiceId, productId:it.productId, partNumber:it.partNumber, name:it.name, qty:it.qty, price:it.price }))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inv), 'Invoices')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'InvoiceItems')
        const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' })
        download('invoices.xlsx', wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return
      }
      data = inv
    }

    if(window.XLSX && kind!=='invoices'){
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), kind.charAt(0).toUpperCase()+kind.slice(1))
      const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' })
      download(`${kind}.xlsx`, wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } else {
      download(`${kind}.csv`, toCSV(data))
    }
  }

  async function importData(kind, file){
    const buf = await file.arrayBuffer()
    if(window.XLSX && file.name.endsWith('.xlsx')){
      const wb = XLSX.read(buf, { type:'array' })
      if(kind==='invoices'){
        const inv = XLSX.utils.sheet_to_json(wb.Sheets['Invoices']||{})
        const items = XLSX.utils.sheet_to_json(wb.Sheets['InvoiceItems']||{})
        await importInvoices(inv, items)
      } else {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]||{})
        await importSimple(kind, rows)
      }
    } else {
      const text = new TextDecoder().decode(buf)
      const rows = fromCSV(text)
      if(kind==='invoices'){
        const inv = rows
        await importInvoices(inv, [])
      } else {
        await importSimple(kind, rows)
      }
    }
  }

  async function importSimple(kind, rows){
    if(!Array.isArray(rows) || !rows.length){ alert('No rows to import'); return }
    if(kind==='products'){
      for(const r of rows){
        const existing = state.products.find(p=> String(p.partNumber).toLowerCase() === String(r.partNumber).toLowerCase())
        const p = {
          partNumber: r.partNumber,
          name: r.name,
          supplier: r.supplier,
          cost: Number(r.cost)||0,
          price: Number(r.price)||0,
          stock: Number(r.stock)||0,
          lowThreshold: r.lowThreshold? Number(r.lowThreshold): undefined,
          notes: r.notes||''
        }
        if(existing){ 
          p.id = existing.id
          await put(STORES.products, p)
        } else { 
          const newId = await add(STORES.products, p)
          p.id = newId
        }
      }
      await reloadProducts()
    }
    if(kind==='customers'){
      for(const r of rows){
        const existing = state.customers.find(c => c.name.toLowerCase() === String(r.name).toLowerCase())
        const c = { name:r.name, phone:r.phone||'', email:r.email||'', address:r.address||'', taxId:r.taxId||'', notes:r.notes||'' }
        if(existing){ 
          c.id = existing.id
          await put(STORES.customers, c)
        } else { 
          const newId = await add(STORES.customers, c)
          c.id = newId
        }
      }
      renderCustomers()
    }
    if(kind==='suppliers'){
      for(const r of rows){
        const existing = state.suppliers.find(s => s.name.toLowerCase() === String(r.name).toLowerCase())
        const s = { name:r.name, phone:r.phone||'', email:r.email||'', address:r.address||'', notes:r.notes||'' }
        if(existing){ 
          s.id = existing.id
          await put(STORES.suppliers, s)
        } else { 
          const newId = await add(STORES.suppliers, s)
          s.id = newId
        }
      }
      renderSuppliers()
    }
    alert('Import completed')
  }

  async function importInvoices(invRows, itemRows){
    // Basic importer: adds invoices; does not reconstruct stock automatically
    for(const i of invRows){
      const inv = { number:i.number||`IMP-${Date.now()}`, date:i.date||todayStr(), customerId: i.customerId? Number(i.customerId): null, total: Number(i.total)||0 }
      inv.id = await add(STORES.invoices, inv)
    }
    for(const it of itemRows){
      const item = { invoiceId: Number(it.invoiceId), productId: Number(it.productId)||null, partNumber: it.partNumber||'', name: it.name||'', qty: Number(it.qty)||0, price: Number(it.price)||0 }
      await add(STORES.invoiceItems, item)
    }
    await loadAll(); renderInvoices(); alert('Invoices imported')
  }

  async function reloadProducts(){ state.products = await getAll(STORES.products); renderInventory() }

  // ---------- Google Sheets Sync ----------
  const GOOGLE = {
    API_KEY: '', // OPTIONAL (for discovery); can be left blank for OAuth-only
    CLIENT_ID: '690184727808-0a1bn3rkf7frvofuischj3grv1mbt815.apps.googleusercontent.com', 
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
  }

  function logStatus(msg){ const el = qs('#gapi-status'); el.textContent = (el.textContent? el.textContent+'\n':'') + msg }
  function errStr(e){
    if(!e) return 'Unknown error'
    if(typeof e === 'string') return e
    if(e.message) return e.message
    // gapi style
    if(e.result && e.result.error && (e.result.error.message || e.result.error.status)){
      const { status, message } = e.result.error
      return `${status||'Error'}: ${message||'(no message)'}`
    }
    if(e.details) return String(e.details)
    try { return JSON.stringify(e) } catch(_) { return String(e) }
  }

  function loadGapi(){
    if(state.gapiLoaded) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://apis.google.com/js/api.js'
      s.onload = async () => {
        gapi.load('client', async ()=>{
          state.gapiLoaded = true
          logStatus('Google API loaded.')
          resolve()
        })
      }
      s.onerror = () => reject(new Error('Failed to load Google API'))
      document.head.appendChild(s)
    })
  }

  function loadGIS(){
    return new Promise((resolve, reject) => {
      if(window.google && google.accounts && google.accounts.oauth2) return resolve()
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(s)
    })
  }

  async function initClient(){
    if(!state.gapiLoaded) await loadGapi()
    await gapi.client.init({
      apiKey: GOOGLE.API_KEY || undefined,
      discoveryDocs: GOOGLE.DISCOVERY_DOCS,
    })
    await loadGIS()
    const hasClientId = !!(GOOGLE.CLIENT_ID && GOOGLE.CLIENT_ID.trim())
    if(!hasClientId){
      logStatus('Auth not configured. Set GOOGLE.CLIENT_ID in app.js to enable sign-in.')
      return
    }
    function createTokenClient(scopes){
      return google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE.CLIENT_ID,
        scope: scopes,
        callback: (tokenResponse) => {
          if(tokenResponse && tokenResponse.access_token){
            state.accessToken = tokenResponse.access_token
            gapi.client.setToken({ access_token: state.accessToken })
            updateSigninStatus(true)
            logStatus('Access granted. Ready to sync.')
          } else if(tokenResponse && tokenResponse.error){
            logStatus('Auth error: ' + errStr(tokenResponse.error))
          }
        }
      })
    }
    state.tokenClient = createTokenClient(GOOGLE.SCOPES)
    state._createTokenClient = createTokenClient
    // No token yet; enable Sign In button
    updateSigninStatus(false)
  }

  function updateSigninStatus(isSignedIn){
    state.gapiAuthed = !!isSignedIn
    qs('#btn-gapi-signin').disabled = !!isSignedIn
    qs('#btn-gapi-signout').disabled = !isSignedIn
    qs('#btn-gs-backup').disabled = !isSignedIn
    qs('#btn-gs-restore').disabled = !isSignedIn
    qs('#btn-gs-create').disabled = !isSignedIn
    qs('#btn-gs-use').disabled = !isSignedIn
    if(isSignedIn) logStatus('Signed in to Google (token active).')
  }

  function signIn(){
    if(!state.tokenClient){ alert('Google auth not configured. Set CLIENT_ID in app.js and click Load Google API.'); return }
    // If we have a token, request without prompt; else prompt for consent
    try{
      const onError = (err) => {
        const msg = errStr(err)
        logStatus('Sign-in error: ' + msg)
        // If Drive scope may be blocked by admin policy, retry with Sheets-only
        if(String(msg).includes('access_denied') && GOOGLE.SCOPES.includes('drive.file')){
          logStatus('Retrying with Sheets-only scope...')
          const sheetsOnly = 'https://www.googleapis.com/auth/spreadsheets'
          state.tokenClient = state._createTokenClient(sheetsOnly)
          state.tokenClient.requestAccessToken({ prompt: 'consent' })
        }
      }
      // GIS errors surface via callback or thrown exceptions; wrap to catch thrown
      state.tokenClient.requestAccessToken({ prompt: state.accessToken ? '' : 'consent' })
    }catch(e){ logStatus('Sign-in error: ' + errStr(e)) }
  }
  function signOut(){
    if(!state.accessToken){ return }
    try{
      const token = state.accessToken
      google.accounts.oauth2.revoke(token, () => {
        state.accessToken = null
        gapi.client.setToken(null)
        updateSigninStatus(false)
        logStatus('Signed out.')
      })
    }catch(e){ logStatus('Sign-out error: ' + errStr(e)) }
  }

  async function ensureSpreadsheet(){
    if(state.spreadsheetId) return state.spreadsheetId
    const title = `Inventory2 Backup ${new Date().toISOString().slice(0,10)}`
    const res = await gapi.client.sheets.spreadsheets.create({ resource: { properties: { title } } })
    const id = res.result.spreadsheetId
    await saveSetting('spreadsheetId', id)
    state.spreadsheetId = id
    logStatus('Created spreadsheet: ' + id)
    return id
  }

  function parseSpreadsheetId(input){
    const s = String(input||'').trim()
    if(!s) return ''
    // Accept raw ID or URL
    const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if(m) return m[1]
    // Basic ID check (length ~ 44 and safe chars)
    if(/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s
    return ''
  }

  function updateSpreadsheetUI(){
    const link = qs('#gs-sheet-link')
    if(!link) return
    if(state.spreadsheetId){
      link.textContent = 'Open Spreadsheet'
      link.href = `https://docs.google.com/spreadsheets/d/${state.spreadsheetId}/edit`
      link.style.pointerEvents = 'auto'
      link.style.opacity = '1'
    } else {
      link.textContent = 'No Spreadsheet Selected'
      link.href = '#'
      link.style.pointerEvents = 'none'
      link.style.opacity = '.6'
    }
  }

  function sheetDataFrom(){
    return {
      Products: state.products.map(p => ({ id:p.id, partNumber:p.partNumber, name:p.name, supplier:p.supplier||'', cost:p.cost||0, price:p.price||0, stock:p.stock||0, lowThreshold:p.lowThreshold??'', notes:p.notes||'' })),
      Customers: state.customers.map(c => ({ id:c.id, name:c.name, phone:c.phone||'', email:c.email||'', address:c.address||'', taxId:c.taxId||'', notes:c.notes||'' })),
      Suppliers: state.suppliers.map(s => ({ id:s.id, name:s.name, phone:s.phone||'', email:s.email||'', address:s.address||'', notes:s.notes||'' })),
      Invoices: state.invoices.map(i => ({ id:i.id, number:i.number, date:i.date, customerId:i.customerId??'', total:i.total })),
      InvoiceItems: state.invoiceItems.map(it => ({ id:it.id, invoiceId:it.invoiceId, productId:it.productId??'', partNumber:it.partNumber||'', name:it.name||'', qty:it.qty||0, price:it.price||0 })),
    }
  }

  async function backupToSheets(){
    const sid = await ensureSpreadsheet()
    const data = sheetDataFrom()
    // Ensure all sheets exist, then write values
    async function listSheetTitles(){
      const res = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sid })
      return (res.result.sheets||[]).map(s=> s.properties.title)
    }
    async function ensureSheet(title){
      const titles = await listSheetTitles()
      if(titles.includes(title)) return
      await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: sid, resource: { requests: [{ addSheet: { properties: { title } } }] } })
    }
    for(const title of Object.keys(data)){
      await ensureSheet(title)
    }
    for(const [title, rows] of Object.entries(data)){
      const header = Object.keys(rows[0]||{id:'',partNumber:'',name:''})
      const values = [header, ...rows.map(r=> header.map(h=> r[h]))]
      // clear range then update
      try { await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: sid, range: `${title}!A:Z` }) } catch(e) {}
      await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: sid, range: `${title}!A1`, valueInputOption:'RAW', resource:{ values } })
    }
    logStatus('Backup complete.')
  }

  async function restoreFromSheets(){
    if(!state.spreadsheetId){ alert('No spreadsheet linked. Perform a backup first or set spreadsheetId in Settings via code.'); return }
    const sid = state.spreadsheetId
    const sheets = ['Products','Customers','Suppliers','Invoices','InvoiceItems']
    const result = {}
    for(const sh of sheets){
      try{
        const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${sh}!A1:Z10000` })
        const values = res.result.values || []
        const [header, ...rows] = values
        if(!header) { result[sh] = []; continue }
        result[sh] = rows.map(r => Object.fromEntries(header.map((h,i)=>[h, r[i]])))
      }catch(e){ logStatus(`Sheet ${sh} missing or error.`) }
    }
    await importSimple('products', result.Products||[])
    await importSimple('customers', result.Customers||[])
    await importSimple('suppliers', result.Suppliers||[])
    await importInvoices(result.Invoices||[], result.InvoiceItems||[])
    logStatus('Restore complete.')
  }

  // ---------- Settings ----------
  function renderSettings(){
    qs('#set-low-threshold').value = state.settings.lowStockThreshold||0
    qs('#set-biz-name').value = state.settings.businessName||''
    qs('#set-invoice-footer').value = state.settings.invoiceFooter||''
    const prev = qs('#set-logo-preview'); if(prev) prev.src = state.settings.logoDataUrl || ''
    const inp = qs('#set-logo'); if(inp) inp.value = ''
  }

  async function saveSettings(){
    await saveSetting('lowStockThreshold', Number(qs('#set-low-threshold').value)||0)
    await saveSetting('businessName', qs('#set-biz-name').value.trim())
    await saveSetting('invoiceFooter', qs('#set-invoice-footer').value.trim())
    renderInventory()
    alert('Settings saved')
  }

  async function saveLogoFromFile(){
    const inp = qs('#set-logo')
    const file = inp?.files?.[0]
    if(!file){ alert('Please choose a PNG or JPG file.'); return }
    if(!/^image\/(png|jpeg)$/.test(file.type)){ alert('Only PNG or JPG images are supported.'); return }
    try{
      const dataUrl = await new Promise((resolve, reject)=>{
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result)
        fr.onerror = () => reject(fr.error||new Error('Read error'))
        fr.readAsDataURL(file)
      })
      await saveSetting('logoDataUrl', dataUrl)
      const prev = qs('#set-logo-preview'); if(prev) prev.src = dataUrl
      inp.value = ''
      alert('Logo saved. It will appear on printed invoices.')
    }catch(e){ alert('Failed to save logo: '+ errStr(e)) }
  }

  async function removeLogo(){
    await saveSetting('logoDataUrl', '')
    const prev = qs('#set-logo-preview'); if(prev) prev.src = ''
    const inp = qs('#set-logo'); if(inp) inp.value = ''
    alert('Logo removed.')
  }

  // ---------- Dev helpers ----------
  async function addTestData(){
    try{
      await ensureDB()
      const ts = Date.now()
      // Supplier
      let s = { name: `Test Supplier ${ts}`, phone:'', email:'', address:'', notes:'' }
      s.id = await add(STORES.suppliers, s)
      // Customer
      let c = { name: `Test Customer ${ts}`, phone:'', email:'', address:'', taxId:'', notes:'' }
      c.id = await add(STORES.customers, c)
      // Product (unique part number)
      let p = { partNumber:`TEST-${ts}`, name:`Test Part ${ts}`, supplier:s.name, cost:1, price:2, stock:3, lowThreshold:1, notes:'' }
      p.id = await add(STORES.products, p)
      // Reload
      state.suppliers = await getAll(STORES.suppliers)
      state.customers = await getAll(STORES.customers)
      await reloadProducts()
      renderCustomers(); renderSuppliers()
      alert('Test data added successfully.')
    }catch(e){ alert('Failed to add test data: '+ (e?.message||e)) }
  }

  async function resetDatabase(){
    try{
      if(state.db && state.db.close){ try{ state.db.close() }catch(_){}}
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => { alert('Local database reset. The app will reload.'); location.reload() }
      req.onerror = () => { alert('Failed to reset DB: '+ (req.error?.message||req.error)) }
      req.onblocked = () => { alert('Reset blocked. Close other tabs of this app and try again.') }
    }catch(e){ alert('Reset error: '+ (e?.message||e)) }
  }

  // ---------- Theme ----------
  function applyTheme(theme){
    const t = (theme==='light') ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', t)
    state.settings.theme = t
    const btn = qs('#btn-theme'); if(btn) btn.textContent = t==='light' ? '☀️' : '🌙'
  }
  async function toggleTheme(){
    const next = state.settings.theme==='light' ? 'dark' : 'light'
    applyTheme(next)
    await saveSetting('theme', next)
  }

  // ---------- Events ----------
  function bindEvents(){
    // Tabs
    qsa('.tab').forEach(btn => btn.addEventListener('click', () => {
      qsa('.tab').forEach(b=>b.classList.remove('active'))
      btn.classList.add('active')
      const v = btn.dataset.view
      qsa('.view').forEach(sec => sec.classList.remove('active'))
      qs(`#view-${v}`).classList.add('active')
    }))

    // Inventory
    qs('#inv-search').addEventListener('input', ()=>renderInventory())
    qs('#btn-add-product').addEventListener('click', ()=> openProductDialog(null))
    qs('#tbl-products').addEventListener('click', (e)=>{
      const btn = e.target.closest('button')
      if(!btn) return
      const tr = e.target.closest('tr'); const id = Number(tr?.dataset.id)
      const p = state.products.find(x=>x.id===id)
      if(btn.dataset.act==='edit'){ openProductDialog(p) }
      if(btn.dataset.act==='del'){
        if(confirm('Delete product?')) del(STORES.products, id).then(()=> reloadProducts())
      }
    })
    // Allow dialog form submit to close the dialog (returnValue 'ok') so close handler runs
    qs('#dlg-product').addEventListener('close', async (e)=>{
      console.log('[ProductDialog] Close event, returnValue:', qs('#dlg-product').returnValue)
      if(qs('#dlg-product').returnValue==='ok'){
        console.log('[ProductDialog] Calling saveProductFromDialog...')
        await saveProductFromDialog()
        console.log('[ProductDialog] Save completed')
      } else {
        console.log('[ProductDialog] Cancelled, not saving')
      }
    })
    qs('#dlg-product button[value="cancel"]').addEventListener('click', ()=> qs('#dlg-product').close())
    qs('#btn-stock-in').addEventListener('click', ()=>{ qs('#dlg-stock-title').textContent='Stock In'; qs('#dlg-stock').dataset.delta = '1'; qs('#dlg-stock').showModal() })
    qs('#btn-stock-out').addEventListener('click', ()=>{ qs('#dlg-stock-title').textContent='Stock Out'; qs('#dlg-stock').dataset.delta = '-1'; qs('#dlg-stock').showModal() })
    qs('#dlg-stock').addEventListener('close', async ()=>{
      if(qs('#dlg-stock').returnValue==='ok') await applyStock(Number(qs('#dlg-stock').dataset.delta)||1)
      qs('#stock-quantity').value=''; qs('#stock-partNumber').value=''; qs('#stock-notes').value=''
    })
    qs('#dlg-stock button[value="cancel"]').addEventListener('click', ()=> qs('#dlg-stock').close())

    // Customers
    qs('#cust-search').addEventListener('input', renderCustomers)
    qs('#btn-add-customer').addEventListener('click', ()=> openCustomerDialog(null))
    qs('#tbl-customers').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return
      const tr = e.target.closest('tr'); const id = Number(tr?.dataset.id)
      const c = state.customers.find(x=>x.id===id)
      if(btn.dataset.act==='edit') openCustomerDialog(c)
      if(btn.dataset.act==='del'){
        if(confirm('Delete customer?')) del(STORES.customers, id).then(()=> { state.customers = state.customers.filter(x=>x.id!==id); renderCustomers() })
      }
    })
    qs('#dlg-customer').addEventListener('close', async ()=>{ 
      console.log('[CustomerDialog] Close event, returnValue:', qs('#dlg-customer').returnValue)
      if(qs('#dlg-customer').returnValue==='ok') {
        console.log('[CustomerDialog] Calling saveCustomerFromDialog...')
        await saveCustomerFromDialog()
      }
    })
    qs('#dlg-customer button[value="cancel"]').addEventListener('click', ()=> qs('#dlg-customer').close())

    // Suppliers
    qs('#supp-search').addEventListener('input', renderSuppliers)
    qs('#btn-add-supplier').addEventListener('click', ()=> openSupplierDialog(null))
    qs('#tbl-suppliers').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return
      const tr = e.target.closest('tr'); const id = Number(tr?.dataset.id)
      const s = state.suppliers.find(x=>x.id===id)
      if(btn.dataset.act==='edit') openSupplierDialog(s)
      if(btn.dataset.act==='del'){
        if(confirm('Delete supplier?')) del(STORES.suppliers, id).then(()=> { state.suppliers = state.suppliers.filter(x=>x.id!==id); renderSuppliers() })
      }
    })
    qs('#dlg-supplier').addEventListener('close', async ()=>{ 
      console.log('[SupplierDialog] Close event, returnValue:', qs('#dlg-supplier').returnValue)
      if(qs('#dlg-supplier').returnValue==='ok') {
        console.log('[SupplierDialog] Calling saveSupplierFromDialog...')
        await saveSupplierFromDialog()
      }
    })
    qs('#dlg-supplier button[value="cancel"]').addEventListener('click', ()=> qs('#dlg-supplier').close())

    // Billing
    qs('#bill-date').value = todayStr()
    qs('#btn-add-line').addEventListener('click', addBillLine)
    qs('#btn-clear-lines').addEventListener('click', ()=>{ state.bill.lines=[]; updateBillTable() })
    qs('#tbl-bill-lines').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return
      if(btn.dataset.act==='rm-line'){
        const tr = e.target.closest('tr'); const i = Number(tr.dataset.i)
        state.bill.lines.splice(i,1); updateBillTable()
      }
    })
    qs('#btn-save-invoice').addEventListener('click', saveInvoice)
    qs('#btn-print-invoice').addEventListener('click', ()=>{
      // Print current staged bill without saving
      const tmpInv = { number: qs('#bill-number').value||'DRAFT', date: qs('#bill-date').value||todayStr(), customerId: Number(qs('#bill-customer').value)||null, total: state.bill.lines.reduce((s,ln)=> s + ln.qty*ln.price, 0), id: -1 }
      const cust = state.customers.find(c=>c.id===tmpInv.customerId)
      const items = state.bill.lines
      const logo = state.settings.logoDataUrl ? `<img src="${state.settings.logoDataUrl}" alt="Logo" style="height:60px; margin-right:16px" />` : ''
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Invoice ${tmpInv.number}</title>
        <style>body{font-family:Segoe UI, Arial; padding:24px} h1{margin:0} .head{display:flex; align-items:center; gap:16px; margin-bottom:4px} .muted{color:#666} table{width:100%; border-collapse:collapse; margin-top:16px} th,td{border-bottom:1px solid #ddd; padding:8px; text-align:left} tfoot td{font-weight:700}</style></head><body>
        <div class=\"head\">${logo}<h1>${escapeHtml(receiptBusinessName())}</h1></div>
        <div class=\"muted\">Invoice # ${escapeHtml(tmpInv.number)} · ${escapeHtml(tmpInv.date)}</div>
        <div style=\"margin-top:12px\"><div><strong>Bill To:</strong> ${escapeHtml(cust?.name || 'Walk-in')}</div>${cust?.address? `<div>${escapeHtml(cust.address)}</div>`:''}${cust?.phone? `<div>${escapeHtml(cust.phone)}</div>`:''}</div>
        <table><thead><tr><th>Part #</th><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
          ${items.map(it=>`<tr><td>${escapeHtml(it.partNumber)}</td><td>${escapeHtml(it.name)}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty*it.price)}</td></tr>`).join('')}
        </tbody><tfoot><tr><td colspan=\"4\" style=\"text-align:right\">Grand Total</td><td>${fmt(tmpInv.total)}</td></tr></tfoot></table>
        <div style=\"margin-top:24px;\">${escapeHtml(state.settings.invoiceFooter||'')}</div>
        <script>setTimeout(()=>window.print(), 100)</script>
      </body></html>`
      const w = window.open('', '_blank')
      w.document.write(html); w.document.close()
    })
    qs('#tbl-invoices').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return
      if(btn.dataset.act==='print'){
        const id = Number(e.target.closest('tr')?.dataset.id); printInvoice(id)
      }
    })

    // Barcode scanning
    qs('#btn-scan-barcode').addEventListener('click', ()=>{
      const dlg = qs('#dlg-scan'); dlg.showModal(); startScanner().catch(err=> logStatus('Scanner error: '+ errStr(err)))
    })
    qs('#dlg-scan').addEventListener('close', ()=> stopScanner())
    qs('#dlg-scan button[value="cancel"]').addEventListener('click', ()=> qs('#dlg-scan').close())

    // Export/Import
    qsa('[data-export]').forEach(b => b.addEventListener('click', ()=> exportData(b.dataset.export)))
    qsa('[data-import]').forEach(inp => inp.addEventListener('change', (e)=>{
      const file = inp.files?.[0]; if(!file) return; importData(inp.dataset.import, file).finally(()=> inp.value='')
    }))

    // Sync
    qs('#btn-gapi-load').addEventListener('click', async ()=>{
      try{
        await initClient()
        qs('#btn-gapi-signin').disabled = !state.tokenClient
        if(state.tokenClient){ logStatus('Client initialized. Click Sign In.') }
        else { logStatus('Client initialized without auth. Set CLIENT_ID to enable sign-in.') }
      }catch(e){ logStatus('Init failed: '+ errStr(e)) }
    })
    qs('#btn-gapi-signin').addEventListener('click', signIn)
    qs('#btn-gapi-signout').addEventListener('click', signOut)
    qs('#btn-gs-backup').addEventListener('click', ()=> backupToSheets().catch(e=> logStatus('Backup error: '+ errStr(e))))
    qs('#btn-gs-restore').addEventListener('click', ()=> restoreFromSheets().catch(e=> logStatus('Restore error: '+ errStr(e))))
    qs('#btn-gs-create')?.addEventListener('click', async ()=>{
      try{ const id = await ensureSpreadsheet(); updateSpreadsheetUI(); logStatus('Spreadsheet ready: '+id) }catch(e){ logStatus('Create error: '+ errStr(e)) }
    })
    qs('#btn-gs-use')?.addEventListener('click', async ()=>{
      const val = qs('#gs-sheet-id').value
      const id = parseSpreadsheetId(val)
      if(!id){ alert('Please paste a valid Spreadsheet URL or ID.'); return }
      state.spreadsheetId = id
      await saveSetting('spreadsheetId', id)
      updateSpreadsheetUI()
      logStatus('Using spreadsheet: '+id)
    })

    // Settings
    qs('#btn-save-settings').addEventListener('click', saveSettings)
    qs('#btn-save-logo')?.addEventListener('click', saveLogoFromFile)
    qs('#btn-remove-logo')?.addEventListener('click', removeLogo)
    qs('#btn-add-test-data')?.addEventListener('click', addTestData)
    qs('#btn-reset-db')?.addEventListener('click', resetDatabase)

    // Theme toggle
    qs('#btn-theme')?.addEventListener('click', toggleTheme)

    // Login/Logout
    qs('#login-form')?.addEventListener('submit', handleLogin)
    qs('#btn-logout')?.addEventListener('click', handleLogout)

    // Explicit dialog form submit handlers ensure close('ok') fires reliably
    const fp = qs('#form-product'); if(fp){ fp.addEventListener('submit', e=>{ console.log('[ProductDialog] Form submit'); e.preventDefault(); const d=qs('#dlg-product'); d.close('ok'); }) }
    const fc = qs('#form-customer'); if(fc){ fc.addEventListener('submit', e=>{ console.log('[CustomerDialog] Form submit'); e.preventDefault(); const d=qs('#dlg-customer'); d.close('ok'); }) }
    const fsu = qs('#form-supplier'); if(fsu){ fsu.addEventListener('submit', e=>{ console.log('[SupplierDialog] Form submit'); e.preventDefault(); const d=qs('#dlg-supplier'); d.close('ok'); }) }
  }

  function activateView(name){
    qsa('.tab').forEach(b=>{
      if(b.dataset.view===name) b.classList.add('active'); else b.classList.remove('active')
    })
    qsa('.view').forEach(sec=>{
      if(sec.id === `view-${name}`) sec.classList.add('active'); else sec.classList.remove('active')
    })
  }

  // ---------- Barcode Scanner ----------
  let _scanStream = null
  let _scanLoop = null
  let _detector = null
  let _zxingReader = null
  async function loadZXing(){
    if(window.ZXing && window.ZXing.BrowserMultiFormatReader) return
    await new Promise((resolve, reject)=>{
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/@zxing/library@0.20.0'
      s.onload = resolve
      s.onerror = ()=> reject(new Error('Failed to load ZXing library'))
      document.head.appendChild(s)
    })
  }
  async function startScanner(){
    const status = qs('#scan-status')
    if('BarcodeDetector' in window){
      try{
        const formats = ['qr_code','code_128','code_39','ean_13','ean_8','upc_e','upc_a','codabar','itf']
        _detector = new window.BarcodeDetector({ formats })
      }catch(e){ _detector = null }
    }
    const video = qs('#scan-video')
    _scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    video.srcObject = _scanStream
    await video.play()
    status.textContent = _detector? 'Scanning… Point camera at barcode.' : 'Scanning (fallback)…'
    // ZXing fallback for browsers without BarcodeDetector (e.g., some iOS)
    if(!_detector){
      try{
        await loadZXing()
        if(window.ZXing && window.ZXing.BrowserMultiFormatReader){
          _zxingReader = new window.ZXing.BrowserMultiFormatReader()
          _zxingReader.decodeFromVideoDevice(null, 'scan-video', (result, err)=>{
            if(result && result.getText){
              const val = result.getText()
              handleScanned(val)
            }
          })
          return
        }
      }catch(e){ /* continue with polling loop below */ }
    }
    const tick = async () => {
      if(!_scanStream) return
      try{
        if(_detector){
          const codes = await _detector.detect(video)
          if(codes && codes.length){
            const val = codes[0].rawValue || ''
            handleScanned(val)
            return
          }
        }
      }catch(e){ /* ignore transient */ }
      _scanLoop = requestAnimationFrame(tick)
    }
    _scanLoop = requestAnimationFrame(tick)
  }
  function stopScanner(){
    if(_scanLoop) cancelAnimationFrame(_scanLoop); _scanLoop = null
    if(_scanStream){ _scanStream.getTracks().forEach(t=>t.stop()); _scanStream = null }
    _detector = null
    try{ if(_zxingReader){ _zxingReader.reset(); _zxingReader = null } }catch(_){}
  }
  function handleScanned(value){
    stopScanner(); qs('#dlg-scan').close()
    // Assume barcode encodes partNumber
    qs('#bill-product').value = value
    // If product exists, auto-fill price
    const p = findProductByPart(value)
    if(p){ qs('#bill-price').value = p.price || 0 }
    // Focus quantity for faster entry
    qs('#bill-qty').focus()
  }

  // ---------- Auth ----------
  function checkAuth(){
    const stored = sessionStorage.getItem('authToken')
    if(stored === btoa(AUTH.username + ':' + AUTH.password)){
      state.isAuthenticated = true
      return true
    }
    return false
  }

  function showLoginScreen(){
    qs('#login-screen').style.display = 'flex'
    qs('#app-content').style.display = 'none'
  }

  function showApp(){
    qs('#login-screen').style.display = 'none'
    qs('#app-content').style.display = 'block'
  }

  function handleLogin(e){
    e.preventDefault()
    const user = qs('#login-username').value.trim()
    const pass = qs('#login-password').value.trim()
    if(user === AUTH.username && pass === AUTH.password){
      const token = btoa(user + ':' + pass)
      sessionStorage.setItem('authToken', token)
      state.isAuthenticated = true
      showApp()
      initApp()
    } else {
      alert('Invalid username or password')
      // Clear both fields to allow retry
      qs('#login-username').value = ''
      qs('#login-password').value = ''
      // Focus username field for easy retry
      qs('#login-username').focus()
    }
  }

  function handleLogout(){
    sessionStorage.removeItem('authToken')
    state.isAuthenticated = false
    qs('#login-username').value = ''
    qs('#login-password').value = ''
    showLoginScreen()
  }

  // ---------- Init ----------
  async function initApp(){
    state.db = await openDB()
    try{ console.log('[DB] opened version', state.db?.version) }catch(_){ }
    await loadSettings()
    await seedIfEmpty()
    await loadAll()
    renderInventory(); renderCustomers(); renderSuppliers(); renderInvoices(); renderSettings(); resetBill()
    updateSpreadsheetUI()

    // Register service worker for PWA/offline caching
    if('serviceWorker' in navigator && location.protocol.startsWith('http')){
      try{ 
        // Unregister old service workers and register fresh one with cache busting
        const registrations = await navigator.serviceWorker.getRegistrations();
        for(let reg of registrations) await reg.unregister();
        await navigator.serviceWorker.register('./service-worker.js?v=3');
        console.log('[SW] Service worker registered successfully');
      }catch(e){ console.warn('[SW] Registration failed:', e); }
    }
  }

  async function init(){
    bindEvents()
    // Open DB early so CRUD always has a live connection even before initApp
    try{ if(!state.db) state.db = await openDB() }catch(e){ console.error('[DB] early open failed', e) }
    if(checkAuth()){
      showApp()
      await initApp()
    } else {
      showLoginScreen()
    }
  }

  window.addEventListener('DOMContentLoaded', init)
})()
