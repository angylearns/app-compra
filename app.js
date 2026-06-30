const firebaseConfig = {
  apiKey: "AIzaSyB8VD6Nkv5DN5A6t66ASN9vaRJnHMHYhBs",
  authDomain: "app-compra-1.firebaseapp.com",
  projectId: "app-compra-1",
  storageBucket: "app-compra-1.firebasestorage.app",
  messagingSenderId: "707546105216",
  appId: "1:707546105216:web:c9517cdd40c97f7c66ad65"
};

let db = null, templateRef = null, currentRef = null, unsubscribeTemplate = null, unsubscribeCurrent = null;
let templateProducts = [], currentProducts = [], activeTab = "template", selectedTagFilter = "", searchString = "";
const AUTH_SESSION_KEY = "shopping_auth_code_secret";

function getAuthCode() { return localStorage.getItem(AUTH_SESSION_KEY) || ""; }

function setAuthCode(code) { 
  if (code) {
    localStorage.setItem(AUTH_SESSION_KEY, code.trim());
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

function getAuthData(data = {}) { return { ...data, accessKey: getAuthCode() }; }

function initFirebaseApp() {
  var secretCode = getAuthCode();
  if (!secretCode) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    templateRef = db.collection("template_" + secretCode);
    currentRef = db.collection("current_" + secretCode);
    bindRealtimeListeners();
  } catch (error) { showNotification("Error al conectar."); }
}

function bindRealtimeListeners() {
  unsubscribeTemplate = templateRef.orderBy("name", "asc").onSnapshot(function (s) {
    templateProducts = [];
    s.forEach(function (d) { templateProducts.push({ id: d.id, ...d.data() }); });
    renderInterface();
  });
  unsubscribeCurrent = currentRef.orderBy("createdAt", "asc").onSnapshot(function (s) {
    currentProducts = [];
    s.forEach(function (d) { currentProducts.push({ id: d.id, ...d.data() }); });
    renderInterface();
  });
}

function killFirebaseListeners() {
  if (unsubscribeTemplate) unsubscribeTemplate();
  if (unsubscribeCurrent) unsubscribeCurrent();
}

async function insertTemplateItem(name, tag) {
  var cName = name.trim();
  var cTag = tag.trim() === "" ? "G" : tag.trim().toUpperCase();
  if (!cName || ["C", "D", "M", "G"].indexOf(cTag) === -1) { showNotification("Tag inválido ❌"); return false; }
  try { await templateRef.add(getAuthData({ name: cName, tag: cTag })); showNotification(`${name} añadido ✅`); return true; } catch (e) { showNotification("Error de permiso ❌"); return false; }
}

function enableInlineEditing(li, product) {
  li.innerHTML = `
    <div class="edit-container" id="editContainer">
      <input type="text" id="editName" class="edit-name" value="${product.name}">
      <input type="text" id="editTag" class="edit-tag" value="${product.tag}" maxlength="1">
      <button id="saveBtn" class="save-btn">💾</button>
    </div>
  `;
  
  const editContainer = li.querySelector("#editContainer");
  editContainer.onclick = (e) => e.stopPropagation();

  const saveBtn = li.querySelector("#saveBtn");
  saveBtn.onclick = async (e) => {
    e.stopPropagation();
    const newName = document.getElementById("editName").value.trim();
    const newTag = document.getElementById("editTag").value.trim().toUpperCase() || "G";
    if (!newName || ["C", "D", "M", "G"].indexOf(newTag) === -1) { showNotification("Datos inválidos ❌"); return; }
    try {
      await templateRef.doc(product.id).update(getAuthData({ name: newName, tag: newTag }));
    } catch (error) { showNotification("Error al guardar ❌"); }
  };
}

function renderInterface() {
  const tListEl = document.getElementById("templateList");
  const sListEl = document.getElementById("shoppingList");
  const templateControls = document.getElementById("templateControls");
  const actions = document.getElementById("currentListActions");
  const emptyState = document.getElementById("emptyState");
  
  const tabTemplate = document.getElementById("tabTemplate");
  const tabCurrent = document.getElementById("tabCurrent");
  if(tabTemplate) tabTemplate.classList.toggle("active", activeTab === "template");
  if(tabCurrent) tabCurrent.classList.toggle("active", activeTab === "current");

  let itemsRendered = 0;

  const isMatch = (item) => {
    const matchesTag = !selectedTagFilter || item.tag === selectedTagFilter || item.tag === "G";
    const matchesSearch = !searchString || item.name.toLowerCase().includes(searchString.toLowerCase());
    return matchesTag && matchesSearch;
  };

  if (activeTab === "template") {
    if(tListEl) tListEl.classList.remove("hidden");
    if(sListEl) sListEl.classList.add("hidden");
    if(templateControls) templateControls.classList.remove("hidden");
    if(actions) actions.classList.add("hidden");
    tListEl.innerHTML = "";
    
    const sorted = [...templateProducts].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(p => {
      if (!isMatch(p)) return;
      itemsRendered++;
      var li = document.createElement("li");
      li.className = `product-item tag-${p.tag}`;
      li.innerHTML = `
        <span class="product-name">${p.name}</span>
        <div class="item-right-side">
          <span class="tag-badge">${p.tag}</span>
          <span class="edit-icon">✎</span>
        </div>
      `;
      li.querySelector('.edit-icon').onclick = (e) => { e.stopPropagation(); enableInlineEditing(li, p); };
      li.onclick = () => { 
        currentRef.add(getAuthData({ name: p.name, tag: p.tag, completed: false, createdAt: Date.now() })); 
        showNotification("Enviado ✅"); 
      };
      tListEl.appendChild(li);
    });
  } else {
    if(tListEl) tListEl.classList.add("hidden");
    if(sListEl) sListEl.classList.remove("hidden");
    if(templateControls) templateControls.classList.add("hidden");
    if(actions) actions.classList.remove("hidden");
    sListEl.innerHTML = "";
    
    const sorted = [...currentProducts].sort((a, b) => a.completed - b.completed);
    
    sorted.forEach(cp => {
      if (!isMatch(cp)) return;
      itemsRendered++;
      var li = document.createElement("li");
      li.className = `product-item tag-${cp.tag}` + (cp.completed ? " completed" : "");
      
      li.innerHTML = `
        <div class="checkbox-visual ${cp.completed ? 'checked' : ''}"></div>
        <span class="product-name">${cp.name}</span>
        <div class="item-right-side">
          <span class="tag-badge">${cp.tag}</span>
        </div>
      `;
      li.onclick = () => { currentRef.doc(cp.id).update(getAuthData({ completed: !cp.completed })); };
      sListEl.appendChild(li);
    });
  }
  
  if(emptyState) emptyState.style.display = (itemsRendered === 0) ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const code = getAuthCode();
  const welcomeScreen = document.getElementById("welcomeScreen");
  const mainApp = document.getElementById("mainApp");

  if (code && welcomeScreen && mainApp) {
    welcomeScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    initFirebaseApp();
  }

  document.getElementById("toggleHeaderBtn").onclick = () => document.getElementById("controlsWrapper").classList.toggle("hidden");
  
  document.getElementById("welcomeForm").onsubmit = (e) => { 
    e.preventDefault(); 
    const val = document.getElementById("welcomeInput").value;
    if(val && val.trim() !== "") {
        setAuthCode(val);
        // Usar un pequeño timeout para asegurar que el storage escriba antes de recargar
        setTimeout(() => { window.location.reload(); }, 100);
    }
  };
  
  document.getElementById("addItemForm").onsubmit = async (e) => { 
    e.preventDefault(); 
    const n = document.getElementById("newItemInput"), t = document.getElementById("tagInput"); 
    const s = await insertTemplateItem(n.value, t.value); 
    if (s) { n.value = ""; t.value = ""; } 
  };
  
  document.getElementById("tabTemplate").onclick = () => { activeTab = "template"; renderInterface(); };
  document.getElementById("tabCurrent").onclick = () => { activeTab = "current"; renderInterface(); };
  
  document.querySelectorAll(".filter-tag-btn").forEach(btn => btn.onclick = () => { 
    document.querySelectorAll(".filter-tag-btn").forEach(b => b.classList.remove("active")); 
    btn.classList.add("active"); 
    selectedTagFilter = btn.getAttribute("data-tag"); 
    renderInterface(); 
  });
  
  document.getElementById("clearSearchBtn").onclick = () => { document.getElementById("searchInput").value = ""; searchString = ""; renderInterface(); };
  document.getElementById("searchInput").addEventListener("input", (e) => { searchString = e.target.value; renderInterface(); });
  
  document.getElementById("finalizePurchaseBtn").onclick = async () => { 
    await Promise.all(currentProducts.filter(p => p.completed).map(p => currentRef.doc(p.id).delete())); 
    showNotification("Finalizado ✅"); 
  };
  
  document.getElementById("changeListBtn").onclick = () => { 
    killFirebaseListeners(); 
    setAuthCode(""); 
    window.location.reload(); 
  };
});

function showNotification(msg) { 
  var el = document.getElementById("notification"); 
  if (el) { 
    el.textContent = msg; 
    el.classList.add("visible"); 
    setTimeout(() => el.classList.remove("visible"), 3000); 
  } 
}
