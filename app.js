// ==========================================
// Configuración de Firebase
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB8VD6Nkv5DN5A6t66ASN9vaRJnHMHYhBs",
  authDomain: "app-compra-1.firebaseapp.com",
  projectId: "app-compra-1",
  storageBucket: "app-compra-1.firebasestorage.app",
  messagingSenderId: "707546105216",
  appId: "1:707546105216:web:c9517cdd40c97f7c66ad65"
};

// ==========================================
// Variables de Control
// ==========================================
let db = null;
let templateRef = null;
let currentRef = null;
let unsubscribeTemplate = null;
let unsubscribeCurrent = null;
let templateProducts = [];
let currentProducts = [];
let activeTab = "template";
let selectedTagFilter = "";
let searchString = "";
const AUTH_SESSION_KEY = "shopping_auth_code_secret";

// ==========================================
// Funciones Base
// ==========================================
function getAuthCode() { return localStorage.getItem(AUTH_SESSION_KEY) || ""; }
function setAuthCode(code) { if (code) localStorage.setItem(AUTH_SESSION_KEY, code.trim()); else localStorage.removeItem(AUTH_SESSION_KEY); }

function getAuthData(data = {}) {
  return { ...data, accessKey: getAuthCode() };
}

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

// ==========================================
// Lógica y Edición
// ==========================================
async function insertTemplateItem(name, tag) {
  var cName = name.trim();
  var cTag = tag.trim() === "" ? "G" : tag.trim().toUpperCase();
  
  if (!cName || ["C", "D", "M", "G"].indexOf(cTag) === -1) { 
    showNotification("Tag inválido (C, D, M o dejar vacío)"); 
    return; 
  }
  try {
    await templateRef.add(getAuthData({ name: cName, tag: cTag }));
    showNotification("Añadido");
  } catch (e) { showNotification("Error de permiso"); }
}

async function copyToCurrentList(product) {
  try {
    await currentRef.add(getAuthData({ name: product.name, tag: product.tag, completed: false, createdAt: Date.now() }));
    showNotification("Enviado a compra");
  } catch (e) { showNotification("Error al transferir"); }
}

async function toggleCurrentItemStatus(id, currentStatus) {
  try {
    await currentRef.doc(id).update(getAuthData({ completed: !currentStatus }));
  } catch (e) { showNotification("Error al actualizar"); }
}

async function finalizeCurrentPurchase() {
  var targets = currentProducts.filter(p => p.completed).map(p => p.id);
  if (targets.length === 0) { showNotification("No hay productos tachados"); return; }
  try {
    await Promise.all(targets.map(id => currentRef.doc(id).delete()));
    showNotification("Compra finalizada");
  } catch (e) { showNotification("Error al borrar"); }
}

function enableInlineEditing(li, product) {
  li.onclick = null;
  li.innerHTML = `
    <input type="text" id="editName" value="${product.name}" style="flex:1; border:1px solid #ccc; padding:2px; border-radius:4px;">
    <input type="text" id="editTag" value="${product.tag}" maxlength="1" style="width:30px; text-transform:uppercase; border:1px solid #ccc; padding:2px; border-radius:4px; text-align:center;">
    <button id="saveBtn" style="margin-left:5px; cursor:pointer;">💾</button>
  `;

  document.getElementById("saveBtn").onclick = async (e) => {
    e.stopPropagation();
    const newName = document.getElementById("editName").value.trim();
    const newTag = document.getElementById("editTag").value.trim().toUpperCase() || "G";

    if (!newName || ["C", "D", "M", "G"].indexOf(newTag) === -1) {
      showNotification("Datos inválidos");
      return;
    }

    try {
      await templateRef.doc(product.id).update(getAuthData({ name: newName, tag: newTag }));
      showNotification("Actualizado");
    } catch (e) {
      showNotification("Error de actualización");
    }
  };
}

// ==========================================
// Renderizado
// ==========================================
function renderInterface() {
  var tListEl = document.getElementById("templateList");
  var sListEl = document.getElementById("shoppingList");
  var controls = document.getElementById("templateControls");
  var actions = document.getElementById("currentListActions");
  var emptyState = document.getElementById("emptyState");
  var itemsRendered = 0;

  if (activeTab === "template") {
    tListEl.classList.remove("hidden");
    sListEl.classList.add("hidden");
    controls.classList.remove("hidden");
    actions.classList.add("hidden");

    tListEl.innerHTML = "";
    templateProducts.forEach(function (p) {
      // Lógica de filtrado:
      if (selectedTagFilter !== "" && selectedTagFilter !== "G" && p.tag !== selectedTagFilter && p.tag !== "G") return;
      if (selectedTagFilter === "G" && p.tag !== "G") return;
      if (searchString && p.name.toLowerCase().indexOf(searchString.toLowerCase()) === -1) return;

      itemsRendered++;
      var li = document.createElement("li");
      li.className = "product-item tag-" + p.tag.toLowerCase();
      li.innerHTML = `<span class="product-name">${p.name}</span><span class="tag-badge">${p.tag}</span>`;

      var icon = document.createElement("span");
      icon.className = "edit-icon";
      icon.textContent = "✎";
      icon.onclick = function (e) { e.stopPropagation(); enableInlineEditing(li, p); };
      li.appendChild(icon);

      li.onclick = () => copyToCurrentList(p);
      tListEl.appendChild(li);
    });
  } else {
    tListEl.classList.add("hidden");
    sListEl.classList.remove("hidden");
    controls.classList.add("hidden");
    actions.classList.remove("hidden");

    sListEl.innerHTML = "";
    currentProducts.forEach(function (cp) {
      // Lógica de filtrado:
      if (selectedTagFilter !== "" && selectedTagFilter !== "G" && cp.tag !== selectedTagFilter && cp.tag !== "G") return;
      if (selectedTagFilter === "G" && cp.tag !== "G") return;
      if (searchString && cp.name.toLowerCase().indexOf(searchString.toLowerCase()) === -1) return;

      itemsRendered++;
      var li = document.createElement("li");
      li.className = "product-item tag-" + cp.tag.toLowerCase() + (cp.completed ? " completed" : "");
      li.innerHTML = `<span class="product-checkbox"></span><span class="product-name">${cp.name}</span><span class="tag-badge">${cp.tag}</span>`;

      li.onclick = () => toggleCurrentItemStatus(cp.id, cp.completed);
      sListEl.appendChild(li);
    });
  }
  emptyState.style.display = (itemsRendered === 0) ? "block" : "none";
}

// ==========================================
// Eventos Globales
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  if (getAuthCode()) {
    document.getElementById("welcomeScreen").classList.add("hidden");
    document.getElementById("mainApp").classList.remove("hidden");
    initFirebaseApp();
  }

  document.getElementById("welcomeForm").onsubmit = (e) => {
    e.preventDefault();
    setAuthCode(document.getElementById("welcomeInput").value);
    window.location.reload();
  };

  document.getElementById("addItemForm").onsubmit = (e) => {
    e.preventDefault();
    insertTemplateItem(document.getElementById("newItemInput").value, document.getElementById("tagInput").value);
    document.getElementById("newItemInput").value = "";
    document.getElementById("tagInput").value = "";
  };

  document.getElementById("tabTemplate").onclick = () => {
    activeTab = "template";
    document.getElementById("tabTemplate").classList.add("active");
    document.getElementById("tabCurrent").classList.remove("active");
    renderInterface();
  };

  document.getElementById("tabCurrent").onclick = () => {
    activeTab = "current";
    document.getElementById("tabCurrent").classList.add("active");
    document.getElementById("tabTemplate").classList.remove("active");
    renderInterface();
  };

  document.querySelectorAll(".filter-tag-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".filter-tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTagFilter = btn.getAttribute("data-tag");
      renderInterface();
    };
  });

  document.getElementById("clearSearchBtn").onclick = () => {
    const searchInput = document.getElementById("searchInput");
    searchInput.value = "";
    searchString = "";
    renderInterface();
    searchInput.focus();
  };

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchString = e.target.value;
    renderInterface();
  });

  document.getElementById("finalizePurchaseBtn").onclick = finalizeCurrentPurchase;

  document.getElementById("changeListBtn").onclick = () => {
    killFirebaseListeners();
    setAuthCode("");
    window.location.reload();
  };
});

function showNotification(msg) {
  var el = document.getElementById("notification");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 3000);
}
