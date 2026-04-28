const API = 'http://localhost:5000/api';
let medicines = [], cart = [], currentFilter = 'All';

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API}/medicines`);
    medicines = await res.json();
  } catch(e) { medicines = []; }
  renderMeds();
  loadPatients();
});

// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', ['browse','orders','admin'][i]===tab));
  document.getElementById('browseTab').style.display = tab==='browse'?'block':'none';
  document.getElementById('ordersTab').style.display = tab==='orders'?'block':'none';
  document.getElementById('adminTab').style.display = tab==='admin'?'block':'none';
  document.getElementById('checkoutSection').classList.remove('show');
  document.getElementById('cartFab').style.display = tab==='browse'?'flex':'none';
  if(tab==='orders') loadMyOrders();
  if(tab==='admin') loadAdminOrders();
}

// ===== FILTER =====
function setFilter(el) {
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  currentFilter = el.dataset.cat;
  renderMeds();
}

// ===== RENDER MEDICINES =====
function renderMeds() {
  const search = (document.getElementById('searchMed')?.value||'').toLowerCase();
  const filtered = medicines.filter(m => {
    const matchCat = currentFilter==='All' || m.category===currentFilter;
    const matchSearch = m.name.toLowerCase().includes(search) || (m.category||'').toLowerCase().includes(search);
    return matchCat && matchSearch;
  });
  const grid = document.getElementById('medGrid');
  if(!filtered.length) { grid.innerHTML='<div class="empty-state"><h3>No medicines found</h3></div>'; return; }
  grid.innerHTML = filtered.map(m => {
    const oos = m.stock <= 0;
    const inCart = cart.find(c=>c.medicine_name===m.name);
    return `<div class="med-card ${oos?'out-of-stock':''}">
      <div class="med-card-cat">${m.category||'Tablet'}</div>
      <div class="med-card-name" title="${esc(m.name)}">${esc(m.name)}</div>
      <div class="med-card-price">₹${parseFloat(m.price).toFixed(2)}</div>
      <div class="med-card-stock">${oos?'❌ Out of Stock':m.stock+' in stock'}</div>
      ${oos?'<button class="btn btn-secondary" disabled>Out of Stock</button>'
        :inCart?`<button class="btn btn-warn" onclick="removeFromCart('${esc(m.name)}')">✓ In Cart (${inCart.quantity})</button>`
        :`<button class="btn btn-primary" onclick="addToCart('${esc(m.name)}',${m.price},${m.stock})">+ Add to Cart</button>`}
    </div>`;
  }).join('');
}

// ===== CART =====
function addToCart(name, price, maxStock) {
  const existing = cart.find(c=>c.medicine_name===name);
  if(existing) { if(existing.quantity<maxStock) existing.quantity++; }
  else cart.push({medicine_name:name, price:parseFloat(price), quantity:1, maxStock});
  updateCartUI(); renderMeds();
}
function removeFromCart(name) { cart=cart.filter(c=>c.medicine_name!==name); updateCartUI(); renderMeds(); }
function changeQty(name, delta) {
  const item = cart.find(c=>c.medicine_name===name);
  if(!item) return;
  item.quantity += delta;
  if(item.quantity<=0) removeFromCart(name);
  else if(item.quantity>item.maxStock) item.quantity=item.maxStock;
  updateCartUI();
}
function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const total = cart.reduce((s,c)=>s+c.price*c.quantity,0);
  badge.textContent = cart.reduce((s,c)=>s+c.quantity,0);
  badge.classList.toggle('hide', cart.length===0);
  document.getElementById('cartTotal').textContent = '₹'+total.toFixed(2);
  const body = document.getElementById('cartBody');
  if(!cart.length) { body.innerHTML='<div class="empty-state"><h3>Cart is empty</h3></div>'; return; }
  body.innerHTML = cart.map(c=>`<div class="cart-item">
    <div class="cart-item-info"><div class="cart-item-name">${esc(c.medicine_name)}</div><div class="cart-item-price">₹${c.price.toFixed(2)} × ${c.quantity} = ₹${(c.price*c.quantity).toFixed(2)}</div></div>
    <div class="cart-item-qty"><button onclick="changeQty('${esc(c.medicine_name)}',-1)">−</button><span>${c.quantity}</span><button onclick="changeQty('${esc(c.medicine_name)}',1)">+</button></div>
    <button class="cart-remove" onclick="removeFromCart('${esc(c.medicine_name)}')">🗑</button>
  </div>`).join('');
}
function openCart() { document.getElementById('cartOverlay').classList.add('show'); document.getElementById('cartPanel').classList.add('show'); updateCartUI(); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('show'); document.getElementById('cartPanel').classList.remove('show'); }

// ===== CHECKOUT =====
function goCheckout() {
  if(!cart.length) return showToast('Cart is empty','error');
  closeCart();
  document.getElementById('browseTab').style.display='none';
  document.getElementById('checkoutSection').classList.add('show');
  document.getElementById('cartFab').style.display='none';
  calcETA();
}
function backToBrowse() {
  document.getElementById('checkoutSection').classList.remove('show');
  document.getElementById('browseTab').style.display='block';
  document.getElementById('cartFab').style.display='flex';
}
function toggleAddressFields() {
  document.getElementById('addressFields').style.display = document.getElementById('ckDeliveryType').value==='Hospital Pickup'?'none':'block';
  calcETA();
}
function calcETA() {
  const type = document.getElementById('ckDeliveryType').value;
  const dist = parseFloat(document.getElementById('ckDistance')?.value)||0;
  const eta = type==='Hospital Pickup'?30:Math.round(30+dist*5);
  document.getElementById('etaTime').textContent = `~${eta} min`;
}
function showFileName() {
  const f = document.getElementById('prescFile').files[0];
  document.getElementById('fileName').textContent = f?f.name:'';
}

// ===== LOAD PATIENTS =====
async function loadPatients() {
  try {
    const res = await fetch(`${API}/patients`);
    const patients = await res.json();
    const html = '<option value="">-- Select Patient --</option>' + patients.map(p=>`<option value="${p.id}">${p.name} (ID: ${p.id_number})</option>`).join('');
    document.getElementById('ckPatient').innerHTML = html;
    document.getElementById('ordPatient').innerHTML = html;
  } catch(e) {}
}

// ===== LOAD ADDRESSES =====
async function loadAddresses() {
  const pid = document.getElementById('ckPatient').value;
  const sel = document.getElementById('ckSavedAddr');
  sel.innerHTML = '<option value="">-- New Address --</option>';
  if(!pid) return;
  try {
    const res = await fetch(`${API}/delivery-addresses/${pid}`);
    const addrs = await res.json();
    addrs.forEach(a => { sel.innerHTML += `<option value="${a.id}" data-addr="${esc(a.address_line)}" data-city="${esc(a.city||'')}" data-pin="${a.pincode||''}" data-phone="${a.phone||''}" data-dist="${a.distance_km||0}">${a.address_line}, ${a.city} - ${a.pincode}</option>`; });
  } catch(e) {}
}
function fillAddress() {
  const opt = document.getElementById('ckSavedAddr').selectedOptions[0];
  if(!opt||!opt.value) return;
  document.getElementById('ckAddress').value = opt.dataset.addr||'';
  document.getElementById('ckCity').value = opt.dataset.city||'';
  document.getElementById('ckPincode').value = opt.dataset.pin||'';
  document.getElementById('ckPhone').value = opt.dataset.phone||'';
  document.getElementById('ckDistance').value = opt.dataset.dist||0;
  calcETA();
}

// ===== PLACE ORDER =====
async function placeOrder() {
  const pid = document.getElementById('ckPatient').value;
  if(!pid) return showToast('Please select a patient','error');
  const deliveryType = document.getElementById('ckDeliveryType').value;
  const isPickup = deliveryType==='Hospital Pickup';

  let addressId = null;
  if(!isPickup) {
    const addr = document.getElementById('ckAddress').value.trim();
    if(!addr) return showToast('Please enter delivery address','error');
    // Save address
    try {
      const res = await fetch(`${API}/delivery-addresses`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ patient_id:pid, address_line:addr, city:document.getElementById('ckCity').value, pincode:document.getElementById('ckPincode').value, phone:document.getElementById('ckPhone').value, distance_km:parseFloat(document.getElementById('ckDistance').value)||0 })
      });
      const data = await res.json();
      addressId = data.id;
    } catch(e) { return showToast('Failed to save address','error'); }
  }

  const formData = new FormData();
  formData.append('patient_id', pid);
  if(addressId) formData.append('address_id', addressId);
  formData.append('items', JSON.stringify(cart.map(c=>({medicine_name:c.medicine_name, quantity:c.quantity}))));
  formData.append('payment_method', document.getElementById('ckPayment').value);
  formData.append('delivery_type', deliveryType);
  formData.append('is_monthly_refill', document.getElementById('ckRefill').checked?'1':'0');
  formData.append('distance_km', document.getElementById('ckDistance')?.value||'0');
  const prescFile = document.getElementById('prescFile').files[0];
  if(prescFile) formData.append('prescription', prescFile);

  try {
    const res = await fetch(`${API}/orders`, { method:'POST', body:formData });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    showToast(`✅ Order #${data.id} placed! ETA: ~${data.eta_minutes} min`,'success');
    cart = [];
    updateCartUI(); renderMeds();
    // Refresh medicines
    const mRes = await fetch(`${API}/medicines`); medicines = await mRes.json();
    renderMeds();
    backToBrowse();
    document.getElementById('prescFile').value='';
    document.getElementById('fileName').textContent='';
  } catch(e) { showToast(e.message,'error'); }
}

// ===== MY ORDERS =====
async function loadMyOrders() {
  const pid = document.getElementById('ordPatient').value;
  const container = document.getElementById('myOrdersList');
  if(!pid) { container.innerHTML='<div class="empty-state"><h3>Select a patient</h3></div>'; return; }
  try {
    const res = await fetch(`${API}/orders/patient/${pid}`);
    const orders = await res.json();
    if(!orders.length) { container.innerHTML='<div class="empty-state"><h3>No orders yet</h3></div>'; return; }
    container.innerHTML = orders.map(o=>renderOrderCard(o, false)).join('');
  } catch(e) { container.innerHTML='<div class="empty-state"><h3>Failed to load</h3></div>'; }
}

// ===== ADMIN ORDERS =====
async function loadAdminOrders() {
  const container = document.getElementById('adminOrdersList');
  try {
    const res = await fetch(`${API}/orders`);
    const orders = await res.json();
    if(!orders.length) { container.innerHTML='<div class="empty-state"><h3>No orders</h3></div>'; return; }
    container.innerHTML = orders.map(o=>renderOrderCard(o, true)).join('');
  } catch(e) { container.innerHTML='<div class="empty-state"><h3>Failed to load</h3></div>'; }
}

function renderOrderCard(o, isAdmin) {
  const statuses = ['Pending Verification','Approved','Packed','Out for Delivery','Delivered'];
  const statusIdx = statuses.indexOf(o.status);
  const sCls = o.status.replace(/\s+/g,'').toLowerCase();
  const sMap = {'pendingverification':'pending','approved':'approved','packed':'packed','outfordelivery':'out','delivered':'delivered','cancelled':'cancelled'};

  let progress = '';
  if(o.status!=='Cancelled') {
    progress = '<div class="progress-bar">' + statuses.map((s,i) => {
      const dotCls = i<statusIdx?'done':i===statusIdx?'current':'';
      const lineCls = i<statusIdx?'done':'';
      return `<div class="progress-step">${i>0?`<div class="progress-line ${lineCls}"></div>`:''}
        <div class="progress-dot ${dotCls}">${i<=statusIdx?'✓':i+1}</div>
        <div class="progress-label">${['Order','Verify','Pack','Ship','Done'][i]}</div></div>`;
    }).join('') + '</div>';
  }

  const itemsHtml = (o.items||[]).map(it=>`${it.medicine_name} ×${it.quantity} (₹${parseFloat(it.price_at_purchase).toFixed(2)})`).join(', ');
  const refillBadge = o.is_monthly_refill?'<span class="refill-badge">🔄 Auto-Refill</span>':'';

  let adminActions = '';
  if(isAdmin && o.status!=='Delivered' && o.status!=='Cancelled') {
    adminActions = `<div class="order-actions">
      <select onchange="updateOrderStatus(${o.id},this.value)">
        <option value="">Update Status</option>
        ${statuses.filter(s=>statuses.indexOf(s)>statusIdx).map(s=>`<option value="${s}">${s}</option>`).join('')}
        <option value="Cancelled">❌ Cancel</option>
      </select>
    </div>`;
  }

  return `<div class="order-card">
    <div class="order-head">
      <div><span class="order-id">Order #${o.id}</span>${refillBadge}</div>
      <span class="status-badge status-${sMap[sCls]||'pending'}">${o.status}</span>
    </div>
    ${progress}
    <div class="order-items-list">📦 ${itemsHtml||'No items'}</div>
    ${o.address_line?`<div class="order-address">📍 ${o.address_line}, ${o.city||''} ${o.pincode||''}</div>`:'<div class="order-address">🏥 Hospital Pickup</div>'}
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#94a3b8;flex-wrap:wrap;gap:4px;">
      <span>💰 ₹${parseFloat(o.total_price).toFixed(2)} • ${o.payment_method}</span>
      <span>⏱ ETA: ~${o.eta_minutes} min</span>
      <span>${new Date(o.created_at).toLocaleDateString()}</span>
    </div>
    ${isAdmin&&o.patient_name?`<div style="font-size:11px;color:#a78bfa;margin-top:4px;">👤 ${o.patient_name}</div>`:''}
    ${o.prescription_file?`<div style="font-size:11px;color:#fbbf24;margin-top:4px;">📎 <a href="/uploads/${o.prescription_file}" target="_blank">View Prescription</a></div>`:''}
    ${adminActions}
  </div>`;
}

async function updateOrderStatus(id, status) {
  if(!status) return;
  try {
    const res = await fetch(`${API}/orders/${id}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    showToast(data.message,'success');
    loadAdminOrders();
  } catch(e) { showToast(e.message,'error'); }
}

// ===== HELPERS =====
function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML.replace(/'/g,'&#39;');}
function showToast(msg,type='success'){const t=document.getElementById('toast');t.textContent=msg;t.className='toast toast-'+type;t.style.display='block';setTimeout(()=>{t.style.display='none';},3500);}
