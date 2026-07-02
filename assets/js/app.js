let catalogData = { brand: {}, products: [] };
const defaultJsonPath = 'data.json';

const $ = (id) => document.getElementById(id);

async function loadData() {
  const saved = localStorage.getItem('catalogProducts');
  if (saved) {
    catalogData = JSON.parse(saved);
  } else {
    const res = await fetch(defaultJsonPath);
    catalogData = await res.json();
    saveData();
  }

  // Backward compatibility for older saved products that do not have description yet.
  catalogData.products = catalogData.products.map((p) => ({ description: '', ...p }));
  saveData();
  renderAll();
}

function saveData() {
  localStorage.setItem('catalogProducts', JSON.stringify(catalogData));
}

function money(value) {
  return Number(value).toFixed(2);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('assets/images/jacket-10zo.svg');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

$('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const image = await fileToDataUrl($('image').files[0]);
  catalogData.products.push({
    style: $('style').value.trim(),
    description: $('description').value.trim(),
    sizes: $('sizes').value.trim(),
    price: money($('price').value),
    category: $('category').value.trim(),
    image
  });
  e.target.reset();
  saveData();
  renderAll();
});

$('layout').addEventListener('change', renderCatalog);
$('createPdf').addEventListener('click', createPdf);
$('downloadJson').addEventListener('click', downloadJson);
$('resetData').addEventListener('click', () => { localStorage.removeItem('catalogProducts'); loadData(); });

function renderAll() {
  renderProductList();
  renderCatalog();
}

function renderProductList() {
  $('productList').innerHTML = catalogData.products.map((p, i) => `
    <div class="product-card">
      <img src="${p.image}" alt="${escapeHtml(p.style)}">
      <strong>${escapeHtml(p.style)}</strong><br>
      ${escapeHtml(p.category)}<br>
      <label class="edit-label">Description
        <textarea id="desc-${i}" class="description-edit">${escapeHtml(p.description || '')}</textarea>
      </label>
      Sizes: ${escapeHtml(p.sizes)}<br>
      $${escapeHtml(p.price)}
      <button onclick="saveDescription(${i})" type="button">Save Description</button>
      <button class="remove" onclick="removeProduct(${i})" type="button">Remove</button>
    </div>
  `).join('');
}

window.saveDescription = (index) => {
  catalogData.products[index].description = $(`desc-${index}`).value.trim();
  saveData();
  renderAll();
};

window.removeProduct = (index) => {
  catalogData.products.splice(index, 1);
  saveData();
  renderAll();
};

function groupByCategory(products) {
  return products.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});
}

function renderCatalog() {
  const perPage = Number($('layout').value);
  const grouped = groupByCategory(catalogData.products);
  let pages = [];
  Object.entries(grouped).forEach(([category, products]) => {
    for (let i = 0; i < products.length; i += perPage) {
      pages.push({ category, products: products.slice(i, i + perPage) });
    }
  });

  $('catalog').innerHTML = pages.map((page, pageIndex) => `
    <article class="page">
      <div class="catalog-header">
        <div class="catalog-logo">${escapeHtml(catalogData.brand.logoText || catalogData.brand.name || 'LOGO')}</div>
        <div class="catalog-title">${escapeHtml(page.category)}</div>
      </div>
      <div class="grid ${perPage === 2 ? 'two' : 'four'}">
        ${page.products.map(productTemplate).join('')}
      </div>
      <div class="footer">
        <span>Standard Upcharges Apply</span>
        <span class="page-number">${pageIndex + 1}</span>
        <span>Call us at ${escapeHtml(catalogData.brand.phone || '')}</span>
      </div>
    </article>
  `).join('');
}

function productTemplate(p) {
  return `
    <div class="item">
      <img src="${p.image}" alt="${escapeHtml(p.style)}">
      <div class="item-info">
        <div class="style">${escapeHtml(p.style)}</div>
        <div class="description">${escapeHtml(p.description || '')}</div>
        <div class="sizes">Sizes: ${escapeHtml(p.sizes)}</div>
        <div class="price">$${escapeHtml(p.price)}</div>
      </div>
    </div>
  `;
}

async function createPdf() {
  renderCatalog();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'letter');
  const pages = document.querySelectorAll('.page');

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const img = canvas.toDataURL('image/jpeg', 1.0);
    if (i > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, 0, 612, 792);
  }
  pdf.save('catalog.pdf');
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(catalogData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
}

loadData();
