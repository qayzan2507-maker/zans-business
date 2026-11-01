/* ============================================================
   PANX BUSINESS v2.0 — Data, Util, Sistem UI, Grafik,
   Dashboard, Produk, Kasir (POS)
   ============================================================ */

/* ---------- Data & penyimpanan ---------- */
const KEY='panx_business_v1';
const THEME_KEY='panx_theme';
const CART_KEY='panx_cart_v1';

let data=null;
try{ data=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ data=null; }
if(!data){
  data={
    products:[
      {id:1,name:'Kopi Premium',category:'Minuman',price:18000,cost:10000,stock:25},
      {id:2,name:'Roti Cokelat',category:'Makanan',price:12000,cost:7000,stock:30},
      {id:3,name:'Air Mineral',category:'Minuman',price:5000,cost:2500,stock:40}
    ],
    customers:[{id:1,name:'Pelanggan Umum',phone:'-',address:'-'}],
    transactions:[],
    expenses:[],
    settings:{name:'PANX BUSINESS',address:'',phone:'',lowStock:5}
  };
  save();
}

let cart=[];
try{ cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ cart=[]; }
if(!Array.isArray(cart)) cart=[];

let posCat='';
let repDays=30;
let trxPage=1;
const TRX_PP=10;

/* ---------- Util ---------- */
function save(){ localStorage.setItem(KEY,JSON.stringify(data)); }
function saveCart(){ localStorage.setItem(CART_KEY,JSON.stringify(cart)); }
function money(n){ return 'Rp'+Number(n||0).toLocaleString('id-ID'); }
function shortMoney(n){
  n=Number(n)||0;
  if(Math.abs(n)>=1e9) return 'Rp'+(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:1})+' M';
  if(Math.abs(n)>=1e6) return 'Rp'+(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' jt';
  if(Math.abs(n)>=1e3) return 'Rp'+(n/1e3).toLocaleString('id-ID',{maximumFractionDigits:0})+' rb';
  return 'Rp'+n;
}
function sum(arr,f){ return arr.reduce((a,x)=>a+(typeof f==='function'?f(x):Number(x[f]||0)),0); }
function uid(){ return Date.now()+Math.floor(Math.random()*1000); }
function today(){ return new Date().toLocaleDateString('sv-SE'); }
function dateText(d){ return new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function el(x){ return document.getElementById(x); }
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
function pageActive(p){ const pg=el('page-'+p); return !!pg&&pg.classList.contains('active'); }

function normalize(){
  if(!Array.isArray(data.products)) data.products=[];
  if(!Array.isArray(data.customers)) data.customers=[];
  if(!Array.isArray(data.transactions)) data.transactions=[];
  if(!Array.isArray(data.expenses)) data.expenses=[];
  data.settings=Object.assign({name:'PANX BUSINESS',address:'',phone:'',lowStock:5},data.settings||{});
  data.transactions.forEach(t=>{ if(!Array.isArray(t.items)) t.items=[]; });
}

function downloadBlob(content,filename,type){
  const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}

/* ---------- Tema & jam ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  const b=el('themeBtn'); if(b) b.textContent = t==='light' ? '🌙' : '☀️';
}
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
  localStorage.setItem(THEME_KEY,cur);
  applyTheme(cur);
  toast(cur==='light'?'Mode terang aktif ☀️':'Mode gelap aktif 🌙','info');
}
function tick(){
  const n=new Date();
  el('clock').textContent=n.toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short'})+' • '+n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

/* ---------- Navigasi ---------- */
const PAGE_TITLES={
  dashboard:['Dashboard','Ringkasan bisnis hari ini'],
  products:['Produk','Kelola produk & stok'],
  pos:['Kasir (POS)','Buat transaksi penjualan'],
  customers:['Pelanggan','Data & riwayat pelanggan'],
  transactions:['Transaksi','Riwayat penjualan'],
  expenses:['Pengeluaran','Catat biaya operasional'],
  reports:['Laporan','Analisis performa bisnis']
};
function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target=el('page-'+page);
  if(target) target.classList.add('active');
  document.querySelectorAll('.nav-btn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const t=PAGE_TITLES[page]||['PANX BUSINESS',''];
  el('pageTitle').textContent=t[0];
  el('pageSub').textContent=t[1];
  refresh();
}
function refresh(){
  renderDashboard();
  renderProducts();
  renderPOS();
  renderCustomers();
  renderTransactions();
  renderExpenses();
  renderReports();
}

/* ---------- Toast notification ---------- */
function toast(msg,type){
  type=type||'success';
  const wrap=el('toastWrap');
  const t=document.createElement('div');
  t.className='toast '+type;
  const icons={success:'✓',error:'✕',info:'ℹ',warning:'⚠'};
  t.innerHTML='<span class="t-ico">'+(icons[type]||'ℹ')+'</span><span class="t-msg">'+esc(msg)+'</span><button class="t-x">✕</button>';
  wrap.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  const kill=()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); };
  t.querySelector('.t-x').addEventListener('click',kill);
  setTimeout(kill,3400);
}

/* ---------- Dialog konfirmasi (pengganti confirm) ---------- */
let confirmResolve=null;
function askConfirm(title,msg,opts){
  opts=opts||{};
  return new Promise(res=>{
    confirmResolve=res;
    el('confirmTitle').textContent=title;
    el('confirmMsg').textContent=msg;
    el('confirmOk').textContent=opts.okText||'Ya, Lanjutkan';
    el('confirmOk').className='btn '+(opts.danger?'btn-red':'btn-blue');
    const ico=el('confirmIco');
    ico.className='confirm-ico '+(opts.danger?'red':'blue');
    ico.textContent=opts.danger?'⚠️':'❓';
    el('confirmModal').classList.add('show');
  });
}
function answerConfirm(v){
  el('confirmModal').classList.remove('show');
  if(confirmResolve){ confirmResolve(v); confirmResolve=null; }
}

/* ---------- Modal umum ---------- */
function showModal(title,html){
  el('modalTitle').textContent=title;
  el('modalBody').innerHTML=html;
  el('modal').classList.add('show');
}
function closeModal(){ el('modal').classList.remove('show'); }

/* ---------- Count-up angka ---------- */
function countUp(elm,target,prefix,dur){
  prefix=prefix==null?'Rp':prefix;
  dur=dur||800;
  const t0=performance.now();
  function frame(t){
    const p=Math.min(1,(t-t0)/dur);
    const e=1-Math.pow(1-p,3);
    elm.textContent=prefix+Math.round(target*e).toLocaleString('id-ID');
    if(p<1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- Tooltip grafik ---------- */
function chartTip(e,label,value){
  const t=el('chartTip');
  t.innerHTML='<b>'+esc(label)+'</b><span>'+money(value)+'</span>';
  t.style.opacity=1;
  const pad=14;
  let x=e.clientX+pad, y=e.clientY-pad-14;
  const r=t.getBoundingClientRect();
  if(x+r.width>window.innerWidth-8) x=e.clientX-r.width-pad;
  t.style.left=x+'px';
  t.style.top=y+'px';
}
function chartTipHide(){ el('chartTip').style.opacity=0; }

/* ---------- Grafik garis SVG ---------- */
function lineChart(box,items,opts){
  opts=opts||{};
  const h=opts.h||230, color=opts.color||'#397bff', grad=opts.grad||('g'+Math.floor(Math.random()*1e6));
  if(!box) return;
  if(!items.length||!sum(items,'value')){
    box.innerHTML='<div class="chart-empty" style="height:'+h+'px">📉 Belum ada data penjualan pada periode ini</div>';
    return;
  }
  const W=Math.max(box.clientWidth||640,300);
  const pl=16,pr=16,pt=24,pb=26;
  const max=Math.max.apply(null,items.map(i=>i.value));
  const n=items.length;
  const stepX=n>1?(W-pl-pr)/(n-1):0;
  const X=i=>n>1?pl+i*stepX:W/2;
  const Y=v=>pt+(1-v/max)*(h-pt-pb);
  const pts=items.map((it,i)=>[X(i),Y(it.value)]);
  let path='',areaPath='';
  if(n>1){
    path='M '+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(let i=0;i<n-1;i++){
      const p0=pts[Math.max(i-1,0)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(i+2,n-1)];
      path+=' C '+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)
           +' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)
           +' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
    }
    areaPath=path+' L '+pts[n-1][0].toFixed(1)+' '+(h-pb)+' L '+pts[0][0].toFixed(1)+' '+(h-pb)+' Z';
  }
  const lblEvery=Math.max(1,Math.ceil(n/7));
  let labels='';
  items.forEach((it,i)=>{
    if(i%lblEvery===0||i===n-1) labels+='<text x="'+X(i).toFixed(1)+'" y="'+(h-7)+'" text-anchor="middle" class="ax-lbl">'+esc(it.label)+'</text>';
  });
  let grid='';
  [pt+(h-pt-pb)*0.5,h-pb].forEach(y=>{ grid+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" class="ax-line"></line>'; });
  const maxLbl='<text x="'+pl+'" y="'+(pt-9)+'" class="ax-val">'+shortMoney(max)+'</text>';
  const areaSvg=areaPath?'<path d="'+areaPath+'" fill="url(#'+grad+')" class="line-area"></path>':'';
  const dots=items.map((it,i)=>'<g class="dot-g" style="animation-delay:'+(0.5+i*0.04).toFixed(2)+'s"><circle class="dot" cx="'+pts[i][0].toFixed(1)+'" cy="'+pts[i][1].toFixed(1)+'" r="4"></circle></g>').join('');
  const bw=Math.max(stepX,10);
  const hots=items.map((it,i)=>'<rect x="'+(X(i)-bw/2).toFixed(1)+'" y="0" width="'+bw.toFixed(1)+'" height="'+h+'" fill="transparent" onmousemove="chartTip(event,\''+it.label+'\','+it.value+')" onmouseleave="chartTipHide()"></rect>').join('');
  box.innerHTML='<svg viewBox="0 0 '+W+' '+h+'" class="line-svg">'
    +'<defs><linearGradient id="'+grad+'" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0%" stop-color="'+color+'" stop-opacity="0.28"></stop>'
    +'<stop offset="100%" stop-color="'+color+'" stop-opacity="0"></stop>'
    +'</linearGradient></defs>'
    +grid+areaSvg
    +(path?'<path d="'+path+'" pathLength="1" class="line-path" style="stroke:'+color+'"></path>':'')
    +dots+hots+labels+maxLbl
    +'</svg>';
}

/* ---------- Grafik donut SVG ---------- */
function donut(items){
  items=(items||[]).filter(i=>i.value>0);
  const total=sum(items,'value');
  if(!total) return '<div class="chart-empty" style="width:170px;height:120px">Belum ada data</div>';
  const size=170,thickness=22;
  const r=(size-thickness)/2,c=size/2,circ=2*Math.PI*r;
  let off=0,segs='';
  items.forEach(it=>{
    const frac=it.value/total, len=frac*circ;
    segs+='<circle r="'+r+'" cx="'+c+'" cy="'+c+'" fill="none" stroke="'+it.color+'" stroke-width="'+thickness+'"'
        +' stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+c+' '+c+')">'
        +'<title>'+esc(it.label)+': '+money(it.value)+' ('+Math.round(frac*100)+'%)</title></circle>';
    off+=len;
  });
  return '<svg viewBox="0 0 '+size+' '+size+'" class="donut">'+segs
    +'<text x="'+c+'" y="'+(c-2)+'" text-anchor="middle" class="donut-big">'+shortMoney(total)+'</text>'
    +'<text x="'+c+'" y="'+(c+18)+'" text-anchor="middle" class="donut-small">Total</text></svg>';
}

/* ---------- Perhitungan periode ---------- */
function periodStart(days){
  if(!days) return '';
  const d=new Date();
  d.setDate(d.getDate()-(days-1));
  return d.toLocaleDateString('sv-SE');
}
function trxInRange(days){
  const from=periodStart(days);
  return from?data.transactions.filter(t=>t.date>=from):data.transactions;
}
function dailySeries(days){
  if(!days){
    const map={};
    data.transactions.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).forEach(t=>{
      const lbl=new Date(t.date+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short'});
      if(!map[t.date]) map[t.date]={label:lbl,value:0};
      map[t.date].value+=t.total;
    });
    return Object.values(map);
  }
  const out=[];
  const map={};
  for(let i=days-1;i>=0;i--){
    const d=new Date();
    d.setDate(d.getDate()-i);
    const k=d.toLocaleDateString('sv-SE');
    const o={label:d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'}),value:0,key:k};
    out.push(o); map[k]=o;
  }
  data.transactions.forEach(t=>{ if(map[t.date]) map[t.date].value+=t.total; });
  return out;
}
function topProducts(days,limit){
  const map={};
  trxInRange(days).forEach(t=>{
    (t.items||[]).forEach(i=>{
      if(!map[i.name]) map[i.name]={name:i.name,qty:0,revenue:0};
      map[i.name].qty+=i.qty;
      map[i.name].revenue+=i.qty*i.price;
    });
  });
  return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,limit||5);
}
function payBreakdown(days){
  const map={};
  trxInRange(days).forEach(t=>{ map[t.payment]=(map[t.payment]||0)+t.total; });
  const PC={'Tunai':'#26cf91','Transfer Bank':'#397bff','QRIS':'#a17bff','Debit':'#38c9dc'};
  return Object.entries(map).map(([k,v])=>({label:k,value:v,color:PC[k]||'#8999b5'}));
}
function payClass(p){ return {'Tunai':'b-green','Transfer Bank':'b-blue','QRIS':'b-purple','Debit':'b-cyan'}[p]||'b-blue'; }

/* ---------- Ikon & warna kategori ---------- */
const CAT_ICON={'Minuman':'🥤','Makanan':'🍞','Snack':'🍪','ATK':'✏️','Elektronik':'🔌','Pakaian':'👕'};
function catIcon(c){ return CAT_ICON[c]||'📦'; }
function catColor(c){
  const cats=[...new Set(data.products.map(p=>p.category))];
  const pal=['#397bff','#26cf91','#a17bff','#ffb648','#38c9dc','#ff6278'];
  return pal[Math.max(0,cats.indexOf(c))%pal.length]||'#8999b5';
}
const EXP_COLOR={'Restock':'#397bff','Gaji':'#a17bff','Operasional':'#ffb648','Lainnya':'#8999b5'};
function catColorE(c){ return EXP_COLOR[c]||'#38c9dc'; }

/* ---------- Daftar produk terlaris (bar) ---------- */
function topList(items,emptyText){
  if(!items.length) return '<div class="empty small">'+(emptyText||'Belum ada penjualan pada periode ini')+'</div>';
  const max=Math.max.apply(null,items.map(i=>i.revenue))||1;
  return items.map((it,idx)=>
    '<div class="top-item">'
    +'<span class="top-rank '+(idx===0?'gold':idx===1?'silver':idx===2?'bronze':'')+'">'+(idx+1)+'</span>'
    +'<div class="top-info"><div class="top-name">'+esc(it.name)+'</div>'
    +'<div class="top-bar"><span data-w="'+Math.max(2,Math.round(it.revenue/max*100))+'"></span></div></div>'
    +'<div class="top-meta"><b>'+money(it.revenue)+'</b><span>'+it.qty+' terjual</span></div>'
    +'</div>').join('');
}
function animateBars(container){
  if(!container) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    container.querySelectorAll('.top-bar span').forEach(s=>{ s.style.width=s.dataset.w+'%'; });
  }));
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const h=new Date().getHours();
  const greet=h<11?'Selamat pagi':h<15?'Selamat siang':h<19?'Selamat sore':'Selamat malam';
  el('dashGreet').textContent=greet+' 👋';
  el('dashDate').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const tKey=today();
  const yd=new Date(); yd.setDate(yd.getDate()-1);
  const yKey=yd.toLocaleDateString('sv-SE');
  const tt=data.transactions.filter(t=>t.date===tKey);
  const yt=data.transactions.filter(t=>t.date===yKey);
  const sT=sum(tt,'total'), sY=sum(yt,'total');
  countUp(el('statSales'),sT);
  const delta=sY>0?Math.round((sT-sY)/sY*100):(sT>0?100:null);
  el('statSalesSub').innerHTML = delta===null
    ? '<span class="muted">Belum ada pembanding kemarin</span>'
    : '<span class="'+(delta>=0?'up':'down')+'">'+(delta>=0?'▲':'▼')+' '+Math.abs(delta)+'%</span> vs kemarin • '+tt.length+' transaksi';

  const pT=sum(tt,t=>t.total-t.cost);
  countUp(el('statProfit'),pT);
  el('statProfitSub').textContent='Margin '+(sT>0?Math.round(pT/sT*100):0)+'% dari penjualan hari ini';

  const lowCount=data.products.filter(p=>p.stock<=data.settings.lowStock).length;
  countUp(el('statProducts'),data.products.length,'');
  el('statProductsSub').innerHTML = data.products.length===0
    ? '<span class="muted">Tambah produk pertamamu</span>'
    : (lowCount?'<span class="warn">'+lowCount+' produk stok menipis</span>':'Semua stok aman ✅');

  countUp(el('statCustomers'),data.customers.length,'');
  el('statCustomersSub').textContent = data.customers.length<=1?'Tambah pelanggan setia kamu':'Termasuk pelanggan umum';

  renderDashChart();
  renderDashLow();
  renderDashRecent();
  renderDashTop();
}
function renderDashChart(){
  if(!pageActive('dashboard')) return;
  const items=dailySeries(7);
  lineChart(el('dashChart'),items,{h:230,color:'#397bff',grad:'gDash'});
  el('dashChartTotal').textContent='Total '+money(sum(items,'value'));
}
function renderDashLow(){
  const low=data.products.filter(p=>p.stock<=data.settings.lowStock).sort((a,b)=>a.stock-b.stock);
  el('dashLow').innerHTML = low.length
    ? low.slice(0,6).map(p=>
        '<div class="low-item"><span class="p-ico">'+catIcon(p.category)+'</span>'
        +'<div class="low-info"><b>'+esc(p.name)+'</b><span class="low-stock '+(p.stock===0?'danger':'warn')+'">Sisa '+p.stock+'</span></div>'
        +'<button class="chip-btn" onclick="restock('+p.id+')">+10 Stok</button></div>').join('')
    : '<div class="empty small"><div class="e-ico">✅</div><b>Semua stok aman</b><span>Tidak ada produk di bawah batas '+data.settings.lowStock+'.</span></div>';
}
function restock(id){
  const p=data.products.find(x=>x.id===id);
  if(!p) return;
  p.stock+=10;
  save();
  toast('Stok "'+p.name+'" ditambah 10 (total '+p.stock+')','success');
  refresh();
}
function renderDashRecent(){
  const recent=data.transactions.slice().sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,5);
  el('dashRecent').innerHTML = recent.length
    ? recent.map(t=>
        '<tr class="row-click" onclick="trxDetail(\''+t.code+'\')">'
        +'<td><b>'+esc(t.code)+'</b><span class="t-time">'+(t.time||'')+'</span></td>'
        +'<td>'+esc(t.customer)+'</td>'
        +'<td><span class="badge '+payClass(t.payment)+'">'+esc(t.payment)+'</span></td>'
        +'<td class="num"><b>'+money(t.total)+'</b></td></tr>').join('')
    : '<tr><td colspan="4"><div class="empty small"><div class="e-ico">🛒</div><b>Belum ada transaksi</b><span>Yuk mulai jualan dari menu Kasir!</span></div></td></tr>';
}
function renderDashTop(){
  const box=el('dashTop');
  box.innerHTML=topList(topProducts(7,5),'Belum ada penjualan 7 hari terakhir');
  animateBars(box);
}

/* ============================================================
   PRODUK
   ============================================================ */
function renderProducts(){
  const sel=el('prodCat');
  const cur=sel.value;
  const cats=[...new Set(data.products.map(p=>p.category))].sort();
  sel.innerHTML='<option value="">Semua Kategori</option>'+cats.map(c=>'<option'+(c===cur?' selected':'')+'>'+esc(c)+'</option>').join('');
  const q=(el('prodSearch').value||'').toLowerCase();
  const sort=el('prodSort').value;
  let list=data.products.filter(p=>
    (!q||p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q))
    &&(!cur||p.category===cur));
  list=list.sort((a,b)=>
    sort==='priceDesc'?b.price-a.price:
    sort==='priceAsc'?a.price-b.price:
    sort==='stockAsc'?a.stock-b.stock:
    a.name.localeCompare(b.name));
  el('prodCount').textContent=list.length+' dari '+data.products.length+' produk';
  el('productGrid').innerHTML = list.length
    ? list.map(p=>{
        const low=p.stock<=data.settings.lowStock;
        return '<div class="product-card'+(p.stock===0?' out':'')+'">'
          +'<div class="p-top"><span class="p-ico">'+catIcon(p.category)+'</span><span class="cat-chip" style="--cc:'+catColor(p.category)+'">'+esc(p.category)+'</span></div>'
          +'<b class="p-name">'+esc(p.name)+'</b>'
          +'<div class="p-price">'+money(p.price)+'<span class="p-cost">Modal '+money(p.cost)+' • Untung '+money(p.price-p.cost)+'/pcs</span></div>'
          +'<div class="p-stock"><span class="stock-badge '+(p.stock===0?'s-out':low?'s-low':'s-ok')+'">'+(p.stock===0?'Stok Habis':'Stok: '+p.stock)+'</span>'
          +'<span class="stock-adj"><button class="sq-btn" onclick="adjStock('+p.id+',-1)" title="Kurangi stok">−</button><button class="sq-btn" onclick="adjStock('+p.id+',1)" title="Tambah stok">+</button></span></div>'
          +'<div class="p-actions"><button class="btn btn-outline sm" onclick="openProductForm('+p.id+')">✏️ Edit</button><button class="btn btn-ghost-red sm" onclick="delProduct('+p.id+')">🗑 Hapus</button></div>'
          +'</div>';
      }).join('')
    : '<div class="empty big grid-span" style="grid-column:1/-1"><div class="e-ico">📦</div><b>Tidak ada produk ditemukan</b><span>Coba kata kunci / kategori lain, atau tambah produk baru.</span></div>';
}
function openProductForm(id){
  const p=id?data.products.find(x=>x.id===id):null;
  const cats=[...new Set(data.products.map(x=>x.category))];
  showModal(p?'Edit Produk':'Tambah Produk',
    '<form onsubmit="saveProduct(event,'+(p?p.id:0)+')" class="form">'
    +'<label class="f-label">Nama Produk</label>'
    +'<input class="input" name="name" required value="'+(p?esc(p.name):'')+'" placeholder="cth: Kopi Susu Gula Aren">'
    +'<label class="f-label">Kategori</label>'
    +'<input class="input" name="category" required list="catList" value="'+(p?esc(p.category):'')+'" placeholder="cth: Minuman">'
    +'<datalist id="catList">'+cats.map(c=>'<option value="'+esc(c)+'">').join('')+'</datalist>'
    +'<div class="form-2col">'
    +'<div><label class="f-label">Harga Jual (Rp)</label><input class="input" name="price" type="number" min="0" required value="'+(p?p.price:'')+'"></div>'
    +'<div><label class="f-label">Harga Modal (Rp)</label><input class="input" name="cost" type="number" min="0" required value="'+(p?p.cost:'')+'"></div>'
    +'</div>'
    +'<label class="f-label">Stok</label>'
    +'<input class="input" name="stock" type="number" min="0" required value="'+(p?p.stock:0)+'">'
    +'<div class="form-foot"><button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-blue">💾 Simpan</button></div>'
    +'</form>');
}
function saveProduct(e,id){
  e.preventDefault();
  const f=new FormData(e.target);
  const name=(f.get('name')||'').trim();
  if(!name){ toast('Nama produk wajib diisi','error'); return; }
  const vals={
    name:name,
    category:(f.get('category')||'').trim()||'Lainnya',
    price:Math.max(0,+f.get('price')||0),
    cost:Math.max(0,+f.get('cost')||0),
    stock:Math.max(0,Math.floor(+f.get('stock')||0))
  };
  if(vals.price<vals.cost) toast('Harga jual lebih rendah dari modal — cek lagi ya','warning');
  if(id){
    Object.assign(data.products.find(x=>x.id===id),vals);
    toast('Produk "'+vals.name+'" diperbarui','success');
  }else{
    data.products.push(Object.assign({id:uid()},vals));
    toast('Produk "'+vals.name+'" ditambahkan','success');
  }
  save();
  closeModal();
  refresh();
}
async function delProduct(id){
  const p=data.products.find(x=>x.id===id);
  if(!p) return;
  if(!await askConfirm('Hapus Produk','Yakin hapus "'+p.name+'"? Riwayat transaksi lama tidak terpengaruh.',{danger:true,okText:'Ya, Hapus'})) return;
  data.products=data.products.filter(x=>x.id!==id);
  save();
  toast('Produk "'+p.name+'" dihapus','info');
  refresh();
}
function adjStock(id,d){
  const p=data.products.find(x=>x.id===id);
  if(!p) return;
  p.stock=Math.max(0,p.stock+d);
  save();
  renderProducts();
  renderDashboard();
}

/* ============================================================
   KASIR (POS)
   ============================================================ */
function renderPOS(){
  renderPosCats();
  renderPosGrid();
  renderCart();
}
function renderPosCats(){
  const cats=[...new Set(data.products.map(p=>p.category))];
  el('posCats').innerHTML='<button class="chip'+(posCat?'':' active')+'" data-cat="">Semua</button>'
    +cats.map(c=>'<button class="chip'+(posCat===c?' active':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>').join('');
}
function renderPosGrid(){
  const q=(el('posSearch').value||'').toLowerCase();
  const list=data.products.filter(p=>(!posCat||p.category===posCat)&&(!q||p.name.toLowerCase().includes(q)));
  el('posGrid').innerHTML = list.length
    ? list.map(p=>{
        const inCart=cart.find(c=>c.id===p.id);
        const left=p.stock-(inCart?inCart.qty:0);
        return '<div class="pos-card'+(p.stock<1?' out':'')+'" data-id="'+p.id+'">'
          +'<span class="p-ico big">'+catIcon(p.category)+'</span>'
          +'<b class="p-name">'+esc(p.name)+'</b>'
          +'<span class="p-price">'+money(p.price)+'</span>'
          +'<span class="stock-badge '+(p.stock===0?'s-out':p.stock<=data.settings.lowStock?'s-low':'s-ok')+'">'+(p.stock===0?'Habis':'Stok '+p.stock)+'</span>'
          +(p.stock>0?'<button class="add-btn">'+(left>0?'+ Keranjang':'Penuh di keranjang')+'</button>':'<span class="out-lbl">Stok Habis</span>')
          +'</div>';
      }).join('')
    : '<div class="empty big grid-span"><div class="e-ico">🔍</div><b>Produk tidak ditemukan</b><span>Coba kata kunci lain.</span></div>';
}
function posEnter(e){
  if(e.key!=='Enter') return;
  const first=el('posGrid').querySelector('.pos-card:not(.out)');
  if(first) addToCart(+first.dataset.id);
}
function addToCart(id){
  const p=data.products.find(x=>x.id===id);
  if(!p) return;
  const c=cart.find(x=>x.id===id);
  const inCart=c?c.qty:0;
  if(inCart+1>p.stock){ toast('Stok "'+p.name+'" hanya tersisa '+p.stock,'warning'); return; }
  if(c) c.qty=(c.qty||0)+1;
  else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
  saveCart();
  renderCart();
  renderPosGrid();
  const tot=el('cartTotal');
  tot.classList.remove('pulse'); void tot.offsetWidth; tot.classList.add('pulse');
}
function chQty(id,d){
  const c=cart.find(x=>x.id===id);
  if(!c) return;
  const q=c.qty+d;
  if(q<1){ rmCart(id); return; }
  const p=data.products.find(x=>x.id===id);
  if(p&&q>p.stock){
    toast('Stok "'+p.name+'" tersisa '+p.stock,'warning');
    c.qty=p.stock;
  }else{
    c.qty=q;
  }
  saveCart();
  renderCart();
  renderPosGrid();
}
function rmCart(id){
  cart=cart.filter(x=>x.id!==id);
  saveCart();
  renderCart();
  renderPosGrid();
}
function clearCart(){
  if(!cart.length) return;
  cart=[];
  saveCart();
  renderCart();
  renderPosGrid();
  toast('Keranjang dikosongkan','info');
}
function renderCart(){
  const wrap=el('cartList');
  el('cartCount').textContent=cart.length;
  wrap.innerHTML = cart.length
    ? cart.map(c=>
        '<div class="cart-item"><div class="ci-info"><b>'+esc(c.name)+'</b>'
        +'<span>'+money(c.price)+' × '+c.qty+' = <b>'+money(c.price*c.qty)+'</b></span></div>'
        +'<div class="ci-ctrl">'
        +'<button class="q-btn" onclick="chQty('+c.id+',-1)">−</button>'
        +'<span class="q-val">'+c.qty+'</span>'
        +'<button class="q-btn" onclick="chQty('+c.id+',1)">+</button>'
        +'<button class="q-btn del" onclick="rmCart('+c.id+')" title="Hapus item">✕</button>'
        +'</div></div>').join('')
    : '<div class="empty small"><div class="e-ico">🛒</div><b>Keranjang kosong</b><span>Klik produk di sebelah kiri untuk menambahkan.</span></div>';
  const cs=el('posCustomer');
  const cv=cs.value;
  cs.innerHTML=data.customers.map(c=>'<option value="'+c.id+'"'+(String(c.id)===cv?' selected':'')+'>'+esc(c.name)+'</option>').join('');
  const total=sum(cart,c=>c.price*c.qty);
  countUp(el('cartTotal'),total,'Rp',350);
  const btn=el('btnCheckout');
  btn.disabled=!cart.length;
  btn.textContent=cart.length?('Bayar Sekarang • '+money(total)):'Pilih Produk Dulu';
  toggleCash();
}
function toggleCash(){
  el('cashRow').style.display=el('posPayment').value==='Tunai'?'block':'none';
  renderChange();
}
function setCash(v){ el('cashGiven').value=v; renderChange(); }
function setCashExact(){ el('cashGiven').value=sum(cart,c=>c.price*c.qty); renderChange(); }
function renderChange(){
  const line=el('changeLine');
  if(!line) return;
  const total=sum(cart,c=>c.price*c.qty);
  const given=+el('cashGiven').value||0;
  if(!cart.length||!given){ line.innerHTML=''; return; }
  if(given<total) line.innerHTML='<span class="down">Kurang '+money(total-given)+'</span>';
  else line.innerHTML='<span class="up">Kembalian '+money(given-total)+'</span>';
}
function checkout(){
  if(!cart.length){ toast('Keranjang masih kosong','warning'); return; }
  for(const c of cart){
    const p=data.products.find(x=>x.id===c.id);
    if(!p||p.stock<c.qty){ toast('Stok "'+c.name+'" tidak mencukupi','error'); return; }
  }
  const cust=data.customers.find(c=>String(c.id)===el('posCustomer').value);
  const payment=el('posPayment').value;
  const total=sum(cart,c=>c.price*c.qty);
  const items=cart.map(c=>{
    const p=data.products.find(x=>x.id===c.id);
    return {name:p.name,qty:c.qty,price:p.price,cost:p.cost};
  });
  const cost=sum(items,i=>i.cost*i.qty);
  const given=+el('cashGiven').value||0;
  const trx={
    code:'PB-'+Date.now().toString().slice(-8),
    date:today(),
    time:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}),
    ts:Date.now(),
    customer:cust?cust.name:'Pelanggan Umum',
    payment:payment,
    total:total,
    cost:cost,
    items:items
  };
  cart.forEach(c=>{
    const p=data.products.find(x=>x.id===c.id);
    if(p) p.stock=Math.max(0,p.stock-c.qty);
  });
  data.transactions.unshift(trx);
  save();
  cart=[];
  saveCart();
  el('cashGiven').value='';
  refresh();
  toast('Transaksi '+trx.code+' berhasil • '+money(total),'success');
  openReceipt(trx,given);
}
function openReceipt(trx,given){
  given=given||0;
  const change=given>trx.total?given-trx.total:0;
  const s=data.settings;
  const rows=trx.items.map(i=>
    '<tr><td>'+esc(i.name)+'<br><small>'+i.qty+' × '+money(i.price)+'</small></td>'
    +'<td class="num">'+money(i.qty*i.price)+'</td></tr>').join('');
  showModal('Struk '+trx.code,
    '<div class="receipt">'
    +'<div class="rc-head"><b>'+esc(s.name)+'</b>'
    +(s.address?'<span>'+esc(s.address)+'</span>':'')
    +(s.phone?'<span>Telp: '+esc(s.phone)+'</span>':'')
    +'</div>'
    +'<div class="rc-meta"><span>'+esc(trx.code)+'</span><span>'+dateText(trx.date)+' '+(trx.time||'')+'</span></div>'
    +'<div class="rc-meta"><span>Pelanggan: '+esc(trx.customer)+'</span><span>'+esc(trx.payment)+'</span></div>'
    +'<table class="rc-table">'+rows+'</table>'
    +'<div class="rc-total"><span>TOTAL</span><b>'+money(trx.total)+'</b></div>'
    +(given?'<div class="rc-line"><span>Tunai diterima</span><span>'+money(given)+'</span></div>'+(change?'<div class="rc-line"><span>Kembalian</span><span>'+money(change)+'</span></div>':''):'')
    +'<div class="rc-foot">Terima kasih telah berbelanja 🙏</div>'
    +'</div>'
    +'<div class="form-foot"><button class="btn btn-outline" onclick="closeModal()">Tutup</button><button class="btn btn-blue" onclick="printReceipt(\''+trx.code+'\')">🖨️ Cetak Struk</button></div>');
}
function printReceipt(code){
  const t=data.transactions.find(x=>x.code===code);
  if(!t) return;
  const w=window.open('','_blank','width=420,height=640');
  if(!w){ toast('Popup diblokir browser — izinkan popup untuk mencetak','warning'); return; }
  const s=data.settings;
  const items=t.items.map(i=>
    '<tr><td>'+esc(i.name)+'<br><small>&nbsp;&nbsp;'+i.qty+' x '+money(i.price)+'</small></td>'
    +'<td class="r">'+money(i.qty*i.price)+'</td></tr>').join('');
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Struk '+esc(t.code)+'</title><style>'
    +'body{font-family:Courier New,monospace;padding:14px;color:#000}'
    +'h2{margin:0;text-align:center;font-size:18px}'
    +'.c{text-align:center}.m{display:flex;justify-content:space-between;font-size:12px}'
    +'hr{border:none;border-top:1px dashed #000;margin:8px 0}'
    +'table{width:100%;border-collapse:collapse;font-size:12px}td{padding:2px 0;vertical-align:top}'
    +'.r{text-align:right}.tot{font-size:16px;font-weight:bold}small{color:#000}'
    +'</style></head><body>'
    +'<h2>'+esc(s.name)+'</h2>'
    +(s.address?'<div class="c" style="font-size:11px">'+esc(s.address)+'</div>':'')
    +(s.phone?'<div class="c" style="font-size:11px">Telp: '+esc(s.phone)+'</div>':'')
    +'<hr><div class="m"><span>'+esc(t.code)+'</span><span>'+dateText(t.date)+' '+(t.time||'')+'</span></div>'
    +'<div class="m"><span>'+esc(t.customer)+'</span><span>'+esc(t.payment)+'</span></div><hr>'
    +'<table>'+items+'</table><hr>'
    +'<table><tr><td class="tot">TOTAL</td><td class="r tot">'+money(t.total)+'</td></tr></table>'
    +'<hr><div class="c" style="font-size:11px">Terima kasih telah berbelanja 🙏<br>'+esc(s.name)+'</div>'
    +'<script>window.onload=function(){window.print()}<\/script>'
    +'</body></html>');
  w.document.close();
}

/* ============================================================
   PELANGGAN
   ============================================================ */
function custStats(name){
  const trx=data.transactions.filter(t=>t.customer===name);
  return {count:trx.length,total:sum(trx,'total')};
}
function renderCustomers(){
  const q=(el('custSearch').value||'').toLowerCase();
  const list=data.customers.filter(c=>!q||c.name.toLowerCase().includes(q)||(c.phone||'').toLowerCase().includes(q));
  el('custRows').innerHTML = list.length
    ? list.map(c=>{
        const st=custStats(c.name);
        return '<tr>'
          +'<td><div class="c-cell"><span class="avatar">'+esc((c.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(c.name)+'</b>'+(c.id===1?'<span class="chip tiny">Umum</span>':'')+'</div></td>'
          +'<td>'+esc(c.phone||'-')+'</td>'
          +'<td class="muted">'+esc(c.address||'-')+'</td>'
          +'<td>'+st.count+'</td>'
          +'<td><b>'+money(st.total)+'</b></td>'
          +'<td class="num actions">'
          +'<button class="btn btn-outline sm" onclick="openCustomerForm('+c.id+')" title="Edit">✏️</button> '
          +'<button class="btn btn-ghost-red sm" onclick="delCustomer('+c.id+')" title="Hapus"'+(c.id===1?' disabled':'')+'>🗑</button>'
          +'</td></tr>';
      }).join('')
    : '<tr><td colspan="6"><div class="empty small">Tidak ada pelanggan ditemukan</div></td></tr>';
}
function openCustomerForm(id){
  const c=id?data.customers.find(x=>x.id===id):null;
  showModal(c?'Edit Pelanggan':'Tambah Pelanggan',
    '<form onsubmit="saveCustomer(event,'+(c?c.id:0)+')" class="form">'
    +'<label class="f-label">Nama</label>'
    +'<input class="input" name="name" required value="'+(c?esc(c.name):'')+'" placeholder="cth: Budi Santoso">'
    +'<label class="f-label">Telepon</label>'
    +'<input class="input" name="phone" value="'+(c?esc(c.phone||''):'')+'" placeholder="cth: 0812-xxxx-xxxx">'
    +'<label class="f-label">Alamat</label>'
    +'<input class="input" name="address" value="'+(c?esc(c.address||''):'')+'" placeholder="cth: Jl. Melati No. 5">'
    +'<div class="form-foot"><button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-blue">💾 Simpan</button></div>'
    +'</form>');
}
function saveCustomer(e,id){
  e.preventDefault();
  const f=new FormData(e.target);
  const name=(f.get('name')||'').trim();
  if(!name){ toast('Nama wajib diisi','error'); return; }
  const vals={name:name,phone:(f.get('phone')||'').trim(),address:(f.get('address')||'').trim()};
  if(id){
    Object.assign(data.customers.find(x=>x.id===id),vals);
    toast('Pelanggan "'+name+'" diperbarui','success');
  }else{
    data.customers.push(Object.assign({id:uid()},vals));
    toast('Pelanggan "'+name+'" ditambahkan','success');
  }
  save();
  closeModal();
  refresh();
}
async function delCustomer(id){
  if(id===1){ toast('Pelanggan umum tidak dapat dihapus','warning'); return; }
  const c=data.customers.find(x=>x.id===id);
  if(!c) return;
  if(!await askConfirm('Hapus Pelanggan','Hapus "'+c.name+'"? Riwayat transaksinya tetap tersimpan.',{danger:true,okText:'Ya, Hapus'})) return;
  data.customers=data.customers.filter(x=>x.id!==id);
  save();
  toast('Pelanggan "'+c.name+'" dihapus','info');
  refresh();
}

/* ============================================================
   TRANSAKSI
   ============================================================ */
function filteredTrx(){
  const q=(el('trxSearch').value||'').toLowerCase();
  const from=el('trxFrom').value, to=el('trxTo').value, pay=el('trxPay').value;
  return data.transactions.filter(t=>{
    if(q&&!((t.code||'').toLowerCase().includes(q)||(t.customer||'').toLowerCase().includes(q))) return false;
    if(from&&t.date<from) return false;
    if(to&&t.date>to) return false;
    if(pay&&t.payment!==pay) return false;
    return true;
  });
}
function renderTransactions(){
  const sorted=filteredTrx().slice().sort((a,b)=>((b.ts||0)-(a.ts||0))||(a.date<b.date?1:a.date>b.date?-1:0));
  const pages=Math.max(1,Math.ceil(sorted.length/TRX_PP));
  if(trxPage>pages) trxPage=pages;
  if(trxPage<1) trxPage=1;
  const show=sorted.slice((trxPage-1)*TRX_PP,trxPage*TRX_PP);
  el('trxSummary').innerHTML='<span class="chip">'+sorted.length+' transaksi</span><span class="chip green">Total '+money(sum(sorted,'total'))+'</span>';
  el('trxRows').innerHTML = show.length
    ? show.map(t=>
        '<tr class="row-click" onclick="trxDetail(\''+t.code+'\')">'
        +'<td><b>'+esc(t.code)+'</b></td>'
        +'<td>'+dateText(t.date)+'<span class="t-time">'+(t.time||'')+'</span></td>'
        +'<td>'+esc(t.customer)+'</td>'
        +'<td><span class="badge '+payClass(t.payment)+'">'+esc(t.payment)+'</span></td>'
        +'<td>'+((t.items||[]).length)+' item</td>'
        +'<td class="num"><b>'+money(t.total)+'</b></td>'
        +'<td class="num actions" onclick="event.stopPropagation()">'
        +'<button class="btn btn-outline sm" onclick="trxDetail(\''+t.code+'\')" title="Detail">👁</button> '
        +'<button class="btn btn-ghost-red sm" onclick="delTrx(\''+t.code+'\')" title="Hapus">🗑</button>'
        +'</td></tr>').join('')
    : '<tr><td colspan="7"><div class="empty small"><div class="e-ico">🧾</div><b>Belum ada transaksi</b><span>Transaksi dari menu Kasir akan muncul di sini.</span></div></td></tr>';
  el('trxPager').innerHTML = pages>1
    ? '<button class="chip-btn" onclick="trxGo('+(trxPage-1)+')"'+(trxPage<=1?' disabled':'')+'>‹ Sebelumnya</button>'
      +'<span>Halaman '+trxPage+' / '+pages+'</span>'
      +'<button class="chip-btn" onclick="trxGo('+(trxPage+1)+')"'+(trxPage>=pages?' disabled':'')+'>Berikutnya ›</button>'
    : '';
}
function trxGo(p){ trxPage=p; renderTransactions(); }
function resetTrxFilters(){
  el('trxSearch').value='';
  el('trxFrom').value='';
  el('trxTo').value='';
  el('trxPay').value='';
  trxPage=1;
  renderTransactions();
}
function trxDetail(code){
  const t=data.transactions.find(x=>x.code===code);
  if(!t) return;
  const rows=(t.items||[]).map(i=>
    '<tr><td>'+esc(i.name)+'</td><td class="num">'+i.qty+' × '+money(i.price)+'</td>'
    +'<td class="num"><b>'+money(i.qty*i.price)+'</b></td></tr>').join('');
  const profit=t.total-t.cost;
  showModal('Detail Transaksi',
    '<div class="trx-detail">'
    +'<div class="td-head"><div><b>'+esc(t.code)+'</b><span>'+dateText(t.date)+' '+(t.time||'')+'</span></div>'
    +'<span class="badge '+payClass(t.payment)+'">'+esc(t.payment)+'</span></div>'
    +'<div class="td-cust">👤 '+esc(t.customer)+'</div>'
    +'<table class="table"><thead><tr><th>Item</th><th class="num">Qty × Harga</th><th class="num">Subtotal</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table>'
    +'<div class="td-sum">'
    +'<div><span>Total</span><b>'+money(t.total)+'</b></div>'
    +'<div><span>Modal</span><b>'+money(t.cost)+'</b></div>'
    +'<div><span>Laba</span><b class="up">'+money(profit)+'</b></div>'
    +'</div>'
    +'<div class="form-foot"><button class="btn btn-outline" onclick="closeModal()">Tutup</button><button class="btn btn-blue" onclick="printReceipt(\''+t.code+'\')">🖨️ Cetak Struk</button></div>'
    +'</div>');
}
async function delTrx(code){
  const t=data.transactions.find(x=>x.code===code);
  if(!t) return;
  if(!await askConfirm('Hapus Transaksi','Hapus transaksi '+code+' sebesar '+money(t.total)+'? Stok tidak dikembalikan otomatis.',{danger:true,okText:'Ya, Hapus'})) return;
  data.transactions=data.transactions.filter(x=>x.code!==code);
  save();
  closeModal();
  toast('Transaksi '+code+' dihapus','info');
  refresh();
}
function exportCSV(){
  const rows=filteredTrx();
  if(!rows.length){ toast('Tidak ada transaksi untuk diekspor','warning'); return; }
  let csv='\ufeffKode;Tanggal;Waktu;Pelanggan;Pembayaran;Item;Total;Modal;Laba\n';
  rows.forEach(t=>{
    const line=[
      t.code,t.date,t.time||'',t.customer,t.payment,
      (t.items||[]).map(i=>i.name+' x'+i.qty).join(', '),
      t.total,t.cost,t.total-t.cost
    ].map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(';');
    csv+=line+'\n';
  });
  downloadBlob(csv,'PANX-BUSINESS-Transaksi.csv','text/csv;charset=utf-8');
  toast(rows.length+' transaksi diekspor ke CSV','success');
}

/* ============================================================
   PENGELUARAN
   ============================================================ */
function renderExpenses(){
  const sel=el('expMonth');
  const cur=sel.value;
  const months=[...new Set(data.expenses.map(x=>(x.date||'').slice(0,7)))].filter(Boolean).sort().reverse();
  sel.innerHTML='<option value="">Semua Bulan</option>'+months.map(m=>{
    const lbl=new Date(m+'-01T00:00:00').toLocaleDateString('id-ID',{month:'long',year:'numeric'});
    return '<option value="'+m+'"'+(m===cur?' selected':'')+'>'+lbl+'</option>';
  }).join('');
  const list=data.expenses.filter(x=>!cur||(x.date||'').slice(0,7)===cur)
    .slice().sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
  el('expTotalChip').textContent='Total: '+money(sum(list,'amount'));
  el('expRows').innerHTML = list.length
    ? list.map(x=>
        '<tr><td>'+dateText(x.date)+'</td>'
        +'<td><b>'+esc(x.description)+'</b></td>'
        +'<td><span class="cat-chip" style="--cc:'+catColorE(x.category)+'">'+esc(x.category)+'</span></td>'
        +'<td class="num"><b class="down">− '+money(x.amount)+'</b></td>'
        +'<td class="num actions"><button class="btn btn-ghost-red sm" onclick="delExpense('+x.id+')" title="Hapus">🗑</button></td></tr>').join('')
    : '<tr><td colspan="5"><div class="empty small"><div class="e-ico">💸</div><b>Belum ada pengeluaran</b><span>Klik "+ Tambah Pengeluaran" untuk mencatat biaya.</span></div></td></tr>';
}
function openExpenseForm(){
  showModal('Tambah Pengeluaran',
    '<form onsubmit="saveExpense(event)" class="form">'
    +'<label class="f-label">Tanggal</label>'
    +'<input class="input" type="date" name="date" required value="'+today()+'">'
    +'<label class="f-label">Keterangan</label>'
    +'<input class="input" name="description" required placeholder="cth: Belanja stok kopi">'
    +'<label class="f-label">Kategori</label>'
    +'<select class="input" name="category"><option>Restock</option><option>Gaji</option><option>Operasional</option><option>Lainnya</option></select>'
    +'<label class="f-label">Jumlah (Rp)</label>'
    +'<input class="input" type="number" min="0" name="amount" required placeholder="0">'
    +'<div class="form-foot"><button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-blue">💾 Simpan</button></div>'
    +'</form>');
}
function saveExpense(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const amount=+f.get('amount')||0;
  if(amount<=0){ toast('Jumlah harus lebih dari 0','error'); return; }
  data.expenses.push({
    id:uid(),
    date:f.get('date'),
    description:(f.get('description')||'').trim(),
    category:f.get('category'),
    amount:amount
  });
  save();
  closeModal();
  toast('Pengeluaran dicatat','success');
  refresh();
}
async function delExpense(id){
  const x=data.expenses.find(z=>z.id===id);
  if(!x) return;
  if(!await askConfirm('Hapus Pengeluaran','Hapus "'+x.description+'" ('+money(x.amount)+')?',{danger:true,okText:'Ya, Hapus'})) return;
  data.expenses=data.expenses.filter(z=>z.id!==id);
  save();
  toast('Pengeluaran dihapus','info');
  refresh();
}

/* ============================================================
   LAPORAN
   ============================================================ */
function renderReports(){
  el('repPeriod').innerHTML=[7,30,90,0].map(d=>
    '<button class="chip'+(repDays===d?' active':'')+'" data-d="'+d+'">'+(d?d+' Hari':'Semua')+'</button>').join('');
  const list=trxInRange(repDays);
  const sales=sum(list,'total');
  const cost=sum(list,'cost');
  const from=periodStart(repDays);
  const exp=sum(data.expenses.filter(x=>!from||x.date>=from),'amount');
  const profit=sales-cost-exp;
  countUp(el('repSales'),sales);
  countUp(el('repCost'),cost);
  countUp(el('repExpense'),exp);
  countUp(el('repProfit'),profit);
  el('repProfit').classList.toggle('neg',profit<0);
  renderRepChart();
  renderRepTop();
  renderRepPay();
}
function renderRepChart(){
  if(!pageActive('reports')) return;
  lineChart(el('repChart'),dailySeries(repDays),{h:250,color:'#397bff',grad:'gRep'});
}
function renderRepTop(){
  const box=el('repTop');
  box.innerHTML=topList(topProducts(repDays,5),'Belum ada penjualan pada periode ini');
  animateBars(box);
}
function renderRepPay(){
  const items=payBreakdown(repDays).filter(i=>i.value>0);
  el('repPay').innerHTML = items.length
    ? '<div class="donut-box">'+donut(items)+'</div>'
      +'<div class="legend">'+items.map(i=>
        '<div class="lg-item"><span class="lg-dot" style="background:'+i.color+'"></span>'
        +'<span class="lg-name">'+esc(i.label)+'</span><b>'+money(i.value)+'</b></div>').join('')+'</div>'
    : '<div class="empty small">Belum ada transaksi pada periode ini</div>';
}
function exportReportCSV(){
  const items=dailySeries(repDays);
  const tops=topProducts(repDays,100);
  if(!items.length&&!tops.length){ toast('Belum ada data untuk diekspor','warning'); return; }
  let csv='\ufeffTanggal;Penjualan\n';
  csv+=items.map(i=>'"'+i.label+'";'+i.value).join('\n');
  csv+='\n\nProduk;Qty;Pendapatan\n';
  csv+=tops.map(p=>'"'+p.name.replace(/"/g,'""')+'";'+p.qty+';'+p.revenue).join('\n');
  downloadBlob(csv,'PANX-BUSINESS-Laporan-'+(repDays||'semua')+'.csv','text/csv;charset=utf-8');
  toast('Laporan CSV diunduh','success');
}

/* ============================================================
   PENGATURAN
   ============================================================ */
function openSettings(){
  const s=data.settings;
  showModal('⚙️ Pengaturan',
    '<form onsubmit="saveSettings(event)" class="form">'
    +'<label class="f-label">Nama Bisnis</label>'
    +'<input class="input" name="name" required value="'+esc(s.name)+'">'
    +'<label class="f-label">Alamat (tampil di struk)</label>'
    +'<input class="input" name="address" value="'+esc(s.address||'')+'" placeholder="cth: Jl. Merdeka No. 10">'
    +'<label class="f-label">Telepon (tampil di struk)</label>'
    +'<input class="input" name="phone" value="'+esc(s.phone||'')+'" placeholder="cth: 0812-3456-7890">'
    +'<label class="f-label">Batas Stok Menipis</label>'
    +'<input class="input" type="number" min="0" name="lowStock" value="'+(s.lowStock||5)+'">'
    +'<div class="data-tools">'
    +'<button type="button" class="btn btn-outline" onclick="exportBackup()">⬇ Backup JSON</button>'
    +'<label class="btn btn-outline" style="cursor:pointer">⬆ Impor JSON<input type="file" accept=".json,application/json" style="display:none" onchange="importBackup(this)"></label>'
    +'<button type="button" class="btn btn-ghost-red" onclick="resetData()">♻️ Reset Data</button>'
    +'</div>'
    +'<div class="form-foot"><button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button><button class="btn btn-blue">💾 Simpan</button></div>'
    +'</form>');
}
function saveSettings(e){
  e.preventDefault();
  const f=new FormData(e.target);
  data.settings.name=(f.get('name')||'').trim()||'PANX BUSINESS';
  data.settings.address=(f.get('address')||'').trim();
  data.settings.phone=(f.get('phone')||'').trim();
  data.settings.lowStock=Math.max(0,Math.floor(+f.get('lowStock')||5));
  save();
  closeModal();
  toast('Pengaturan disimpan','success');
  refresh();
}
function exportBackup(){
  downloadBlob(JSON.stringify(data,null,2),'PANX-BUSINESS-Backup-'+today()+'.json','application/json');
  toast('Backup JSON diunduh','success');
}
function importBackup(input){
  const file=input.files&&input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const d=JSON.parse(reader.result);
      if(!d||!Array.isArray(d.products)) throw new Error('format');
      data=d;
      normalize();
      save();
      closeModal();
      toast('Data berhasil diimpor','success');
      refresh();
    }catch(err){
      toast('File backup tidak valid','error');
    }
  };
  reader.readAsText(file);
  input.value='';
}
async function resetData(){
  if(!await askConfirm('Reset Semua Data','SEMUA data (produk, transaksi, pelanggan, pengeluaran) akan dihapus permanen dan kembali ke data contoh. Lanjutkan?',{danger:true,okText:'Ya, Reset Semua'})) return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CART_KEY);
  location.reload();
}

/* ============================================================
   EVENT GLOBAL & INISIALISASI
   ============================================================ */
el('modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
el('confirmModal').addEventListener('click',e=>{ if(e.target.id==='confirmModal') answerConfirm(false); });
el('confirmOk').addEventListener('click',()=>answerConfirm(true));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeModal(); answerConfirm(false); }
});
el('posCats').addEventListener('click',e=>{
  const b=e.target.closest('.chip');
  if(!b) return;
  posCat=b.dataset.cat||'';
  renderPosCats();
  renderPosGrid();
});
el('posGrid').addEventListener('click',e=>{
  const card=e.target.closest('.pos-card');
  if(card&&!card.classList.contains('out')) addToCart(+card.dataset.id);
});
el('repPeriod').addEventListener('click',e=>{
  const b=e.target.closest('.chip');
  if(!b) return;
  repDays=+b.dataset.d||0;
  renderReports();
});

(function init(){
  normalize();
  cart=cart.filter(c=>{
    const p=data.products.find(x=>x.id===c.id);
    if(!p) return false;
    c.qty=Math.min(c.qty,p.stock);
    return c.qty>0;
  });
  saveCart();
  applyTheme(localStorage.getItem(THEME_KEY)||'dark');
  tick();
  setInterval(tick,1000);
  navigate('dashboard');
  window.addEventListener('resize',debounce(()=>{
    if(pageActive('dashboard')) renderDashChart();
    if(pageActive('reports')) renderRepChart();
  },250));
})();
