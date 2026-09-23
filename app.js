/* ==========================================================
   بيانات التطبيق
   كل الأخبار محفوظة محلياً على الجهاز (localStorage).
   لتوسيع التطبيق لاحقاً بربطه بخادم/API خارجي، عدّل فقط
   الدوال الثلاث: loadNews / saveNews في هذا القسم.
   ========================================================== */
const STORE_KEY = 'taqadum_news_v1';
const AUTH_KEY  = 'taqadum_admin_ok';
const USER_KEY  = 'taqadum_admin_user';
const PASS_KEY  = 'taqadum_admin_pass';
const DEFAULT_USERNAME = 'takadom';
const DEFAULT_PASSWORD = 'Mm664482mm@@';

function loadNews(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || seedNews(); }
  catch(e){ return seedNews(); }
}
function saveNews(list){
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}
function seedNews(){
  const seed = [{
    id: crypto.randomUUID(),
    title: 'مرحباً بكم في تطبيق حزب تقدّم',
    body: 'هذا خبر تجريبي أولي. يمكنكم حذفه أو تعديله من لوحة التحكم، وإضافة أخباركم الفعلية من هناك.',
    date: new Date().toISOString()
  }];
  saveNews(seed);
  return seed;
}

/* ==========================================================
   التنقل بين الأقسام
   ========================================================== */
const viewEl = document.getElementById('view');
const tagline = document.getElementById('tagline');
let currentTab = 'news';
let currentDetailId = null;

document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    currentDetailId = null;
    render();
  });
});

function render(){
  if(currentTab === 'news'){
    tagline.textContent = 'أخبار وبيانات الحزب';
    currentDetailId ? renderDetail() : renderNewsList();
  } else {
    tagline.textContent = 'لوحة التحكم';
    renderAdmin();
  }
}

/* ---------- عرض الأخبار للزائر ---------- */
function renderNewsList(){
  const news = loadNews().sort((a,b)=> new Date(b.date) - new Date(a.date));
  if(news.length === 0){
    viewEl.innerHTML = `<div class="empty-state">
      <p>لا توجد أخبار حالياً.<br>ستظهر هنا فور إضافتها من لوحة التحكم.</p>
    </div>`;
    return;
  }
  viewEl.innerHTML = news.map(n => `
    <button class="news-card" data-id="${n.id}">
      <span class="news-date">${formatDate(n.date)}</span>
      <p class="news-title">${escapeHtml(n.title)}</p>
      <p class="news-excerpt">${escapeHtml(excerpt(n.body))}</p>
    </button>
  `).join('');
  viewEl.querySelectorAll('.news-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      currentDetailId = card.dataset.id;
      render();
    });
  });
}

function renderDetail(){
  const item = loadNews().find(n => n.id === currentDetailId);
  if(!item){ currentDetailId = null; return renderNewsList(); }
  viewEl.innerHTML = `
    <button class="back-btn" id="backBtn">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      رجوع
    </button>
    <h1 class="detail-title">${escapeHtml(item.title)}</h1>
    <span class="detail-date">${formatDate(item.date)}</span>
    <div class="detail-body">${escapeHtml(item.body)}</div>
  `;
  document.getElementById('backBtn').addEventListener('click', ()=>{
    currentDetailId = null; render();
  });
}

/* ---------- لوحة التحكم ---------- */
function isAuthed(){ return sessionStorage.getItem(AUTH_KEY) === '1'; }

function renderAdmin(){
  if(!isAuthed()){
    viewEl.innerHTML = `
      <div class="admin-locked">
        <div class="field">
          <label>اسم المستخدم</label>
          <input type="text" id="userInput" placeholder="اسم المستخدم" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false">
        </div>
        <div class="field">
          <label>كلمة المرور</label>
          <input type="password" id="passInput" placeholder="أدخل كلمة مرور لوحة التحكم" autocomplete="current-password">
        </div>
        <button class="btn btn-primary" id="loginBtn" style="width:100%">دخول</button>
      </div>`;
    document.getElementById('loginBtn').addEventListener('click', ()=>{
      const userVal = document.getElementById('userInput').value.trim().toLowerCase();
      const passVal = document.getElementById('passInput').value;
      const savedUser = (localStorage.getItem(USER_KEY) || DEFAULT_USERNAME).toLowerCase();
      const savedPass = localStorage.getItem(PASS_KEY) || DEFAULT_PASSWORD;
      if(userVal === savedUser && passVal === savedPass){
        sessionStorage.setItem(AUTH_KEY,'1'); renderAdmin();
      } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    });
    return;
  }

  const news = loadNews().sort((a,b)=> new Date(b.date) - new Date(a.date));
  viewEl.innerHTML = `
    <div class="admin-header">
      <h2>إدارة الأخبار</h2>
      <button class="btn btn-primary" id="addBtn">+ خبر جديد</button>
    </div>
    <div id="adminList"></div>
    <button class="btn-danger" id="logoutBtn" style="margin-top:10px">تسجيل الخروج</button>
  `;
  const listEl = document.getElementById('adminList');
  listEl.innerHTML = news.map(n => `
    <div class="admin-list-item">
      <div class="meta">
        <h3>${escapeHtml(n.title)}</h3>
        <span>${formatDate(n.date)}</span>
      </div>
      <div class="admin-actions">
        <button class="icon-btn" data-edit="${n.id}" aria-label="تعديل">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 20h4L20 8l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn" data-del="${n.id}" aria-label="حذف">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 7h12M9 7V5h6v2m-8 0 1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `).join('') || `<p class="hint">لا توجد أخبار مضافة بعد.</p>`;

  document.getElementById('addBtn').addEventListener('click', ()=> renderForm());
  listEl.querySelectorAll('[data-edit]').forEach(b=>{
    b.addEventListener('click', ()=> renderForm(b.dataset.edit));
  });
  listEl.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(confirm('حذف هذا الخبر نهائياً؟')){
        saveNews(loadNews().filter(n => n.id !== b.dataset.del));
        renderAdmin();
      }
    });
  });
  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    sessionStorage.removeItem(AUTH_KEY); renderAdmin();
  });
}

function renderForm(editId){
  const news = loadNews();
  const existing = editId ? news.find(n => n.id === editId) : null;
  viewEl.innerHTML = `
    <button class="back-btn" id="cancelBtn">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      رجوع
    </button>
    <h2 class="admin-header" style="margin-bottom:16px">${existing ? 'تعديل الخبر' : 'خبر جديد'}</h2>
    <div class="field">
      <label>العنوان</label>
      <input type="text" id="titleInput" value="${existing ? escapeAttr(existing.title) : ''}" placeholder="عنوان الخبر">
    </div>
    <div class="field">
      <label>النص</label>
      <textarea id="bodyInput" placeholder="نص الخبر الكامل">${existing ? existing.body : ''}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="saveBtn">${existing ? 'حفظ التعديلات' : 'نشر الخبر'}</button>
      <button class="btn btn-secondary" id="cancelBtn2">إلغاء</button>
    </div>
  `;
  const back = ()=> renderAdmin();
  document.getElementById('cancelBtn').addEventListener('click', back);
  document.getElementById('cancelBtn2').addEventListener('click', back);
  document.getElementById('saveBtn').addEventListener('click', ()=>{
    const title = document.getElementById('titleInput').value.trim();
    const body = document.getElementById('bodyInput').value.trim();
    if(!title || !body){ alert('يرجى تعبئة العنوان والنص'); return; }
    if(existing){
      existing.title = title; existing.body = body;
      saveNews(news);
    } else {
      news.push({ id: crypto.randomUUID(), title, body, date: new Date().toISOString() });
      saveNews(news);
    }
    renderAdmin();
  });
}

/* ---------- أدوات مساعدة ---------- */
function formatDate(iso){
  return new Date(iso).toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric' });
}
function excerpt(text){ return text.length > 110 ? text.slice(0,110).trim() + '…' : text; }
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(str){ return escapeHtml(str); }

/* ---------- تشغيل ---------- */
render();

/* تنظيف تلقائي: يشيل أي Service Worker قديم مسجّل من نسخ سابقة
   ويمسح كل الكاش، حتى ما يعلق أي زائر بنسخة قديمة مخزّنة أبداً. */
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>{
    regs.forEach(reg=> reg.unregister());
  });
}
if(window.caches){
  caches.keys().then(keys=> keys.forEach(k=> caches.delete(k)));
}
