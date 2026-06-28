const STORAGE_KEY = 'shopping_list_data';

let products = [];
let currentFilter = '';

// ==========================================
// PASO A: Inicializacion y LocalStorage
// ==========================================

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        products = parsed;
        return true;
      }
    }
  } catch (e) {
    clearStorage();
    showNotification('Error al cargar datos guardados. Se han limpiado.');
  }
  products = [];
  return false;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    showNotification('Error al guardar la lista en el almacenamiento local.');
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

// ==========================================
// PASO B: Lectura y Limpieza del Archivo .md
// ==========================================

const MARKDOWN_PREFIX_REGEX = /^\s*([-*]|-\s*\[\s*[ xX]?\s*\])?\s*/;

function parseMarkdownContent(text) {
  const lines = text.split(/\r?\n/);
  const items = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const cleaned = trimmed.replace(MARKDOWN_PREFIX_REGEX, '').trim();
    if (!cleaned) continue;

    items.push({
      id: Date.now() + Math.random(),
      name: cleaned,
      completed: false,
    });
  }

  return items;
}

function handleFileUpload(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const content = e.target.result;
      if (typeof content !== 'string' || content.trim().length === 0) {
        showNotification('El archivo esta vacio o no es valido.');
        return;
      }

      const parsed = parseMarkdownContent(content);

      if (parsed.length === 0) {
        showNotification('No se encontraron productos en el archivo.');
        return;
      }

      products = parsed;
      saveToStorage();
      render();
      showNotification('Lista cargada correctamente (' + parsed.length + ' productos).');
    } catch (err) {
      showNotification('Error al leer el archivo. Verifica que sea un .md valido.');
    }
  };

  reader.onerror = function () {
    showNotification('Error al leer el archivo.');
  };

  reader.readAsText(file);
}

// ==========================================
// Entrada Manual
// ==========================================

function addItem(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    showNotification('Introduce un nombre de producto valido.');
    return;
  }

  products.push({
    id: Date.now() + Math.random(),
    name: trimmed,
    completed: false,
  });

  saveToStorage();
  render();
  showNotification('"' + trimmed + '" anadido a la lista.');
}

// ==========================================
// PASO C: Renderizado, Reordenamiento e Interaccion
// ==========================================

function render() {
  const listEl = document.getElementById('shoppingList');
  const emptyEl = document.getElementById('emptyState');
  const fragment = document.createDocumentFragment();

  const sorted = [...products].sort(function (a, b) {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  for (const product of sorted) {
    const li = document.createElement('li');
    li.className = 'product-item' + (product.completed ? ' completed' : '');
    li.dataset.id = product.id;

    if (currentFilter) {
      const match = product.name.toLowerCase().includes(currentFilter);
      if (!match) {
        li.classList.add('hidden');
      }
    }

    const checkbox = document.createElement('span');
    checkbox.className = 'product-checkbox';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'product-name';
    nameSpan.textContent = product.name;

    li.appendChild(checkbox);
    li.appendChild(nameSpan);

    li.addEventListener('click', function () {
      toggleProduct(product.id);
    });

    fragment.appendChild(li);
  }

  listEl.innerHTML = '';
  listEl.appendChild(fragment);

  emptyEl.style.display = products.length === 0 ? 'block' : 'none';
}

function toggleProduct(id) {
  const product = products.find(function (p) { return p.id === id; });
  if (!product) return;

  product.completed = !product.completed;
  saveToStorage();
  render();
}

// ==========================================
// PASO D: Buscador en Tiempo Real
// ==========================================

function filterList(query) {
  currentFilter = query.toLowerCase().trim();
  const items = document.querySelectorAll('.product-item');

  for (const item of items) {
    const name = item.querySelector('.product-name').textContent.toLowerCase();
    const match = !currentFilter || name.includes(currentFilter);
    item.classList.toggle('hidden', !match);
  }
}

// ==========================================
// UI helpers
// ==========================================

function showNotification(message) {
  const el = document.getElementById('notification');
  if (!el) return;

  el.textContent = message;
  el.classList.add('visible');

  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(function () {
    el.classList.remove('visible');
  }, 3000);
}

// ==========================================
// Inicializacion
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  loadFromStorage();
  render();

  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    fileInput.value = '';
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function (e) {
    filterList(e.target.value);
  });

  const addForm = document.getElementById('addItemForm');
  const newItemInput = document.getElementById('newItemInput');
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    addItem(newItemInput.value);
    newItemInput.value = '';
    newItemInput.focus();
  });
});
