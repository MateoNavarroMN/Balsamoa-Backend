// ==========================================
// NAVEGACIÓN Y UI
// ==========================================
const TITULOS_SECCION = {
  dashboard: 'Dashboard',
  pedidos: 'Gestión de Pedidos',
  catalogo: 'Catálogo de Productos',
  clientes: 'Clientes Registrados',
  newsletter: 'Newsletter'
};

function navegarA(nombre) {
  cerrarDrawer();
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById(`section-${nombre}`)?.classList.add('active');
  document.getElementById(`nav-${nombre}`)?.classList.add('active');
  document.getElementById('topbar-titulo').textContent = TITULOS_SECCION[nombre] ?? 'Panel';

  if (nombre === 'catalogo') cargarCatalogoDesdeBD();
  if (nombre === 'pedidos') cargarPedidosDesdeBD();
  if (nombre === 'clientes') cargarClientesDesdeBD();
  if (nombre === 'newsletter') cargarNewsletterDesdeBD();
}


// ==========================================
// DRAWER MOBILE
// ==========================================
function abrirDrawer() {
  document.getElementById('sidebar').classList.add('drawer-abierto');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function cerrarDrawer() {
  document.getElementById('sidebar').classList.remove('drawer-abierto');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.body.style.overflow = '';
}

// Cerrar drawer al navegar (mobile)
function alternarTema() {
  const html = document.documentElement;
  const esDark = html.dataset.theme === 'dark';
  html.dataset.theme = esDark ? 'light' : 'dark';
  document.getElementById('icono-tema').className = esDark ? 'ti ti-moon' : 'ti ti-sun';
}

function mostrarToast(mensaje, icono = 'ti-check') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-mensaje').textContent = mensaje;
  toast.querySelector('i').className = `ti ${icono}`;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3500);
}

// ==========================================
// ESTADO GLOBAL
// ==========================================
let catalogoMemoria = [];
let categoriasMemoria = [];
let tallesMemoria = [];
let coloresMemoria = [];
// Variantes del producto en edición. Se sincroniza desde la tabla
// antes de cada toggleChip para no perder stocks al reordenar chips.
let variantesEnEdicion = [];

// ==========================================
// CARGA INICIAL
// ==========================================
async function cargarCategorias() {
  try {
    const res = await fetch('/api/v1/admin/categorias');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    categoriasMemoria = await res.json();
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    categoriasMemoria = [];
  }
  poblarSelectsCategorias();
}

async function cargarTallesYColores() {
  try {
    const [resTalles, resColores] = await Promise.all([
      fetch('/api/v1/admin/talles'),
      fetch('/api/v1/admin/colores'),
    ]);
    tallesMemoria = resTalles.ok ? await resTalles.json() : [];
    coloresMemoria = resColores.ok ? await resColores.json() : [];
  } catch (error) {
    console.error('Error al cargar talles/colores:', error);
  }
}

function poblarSelectsCategorias() {
  const opciones = categoriasMemoria
    .map(c => `<option value="${c.id}">${c.nombre}</option>`)
    .join('');
  document.getElementById('filtro-categoria-prod').innerHTML =
    `<option value="">Todas las categorías</option>${opciones}`;
  document.getElementById('prod-categoria').innerHTML =
    `<option value="">Seleccionar...</option>${opciones}`;
}

// ==========================================
// CATÁLOGO — Carga y renderizado
// ==========================================
async function cargarCatalogoDesdeBD() {
  const tbody = document.getElementById('catalogo-tbody');
  tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center;padding:20px;color:var(--txt-3);"><i class="ti ti-loader"></i> Cargando productos...</div></td></tr>`;

  try {
    const res = await fetch('/api/v1/admin/productos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.mensaje) throw new Error(data.mensaje);
    catalogoMemoria = data;
    aplicarFiltrosCatalogo();
  } catch (error) {
    console.error('Error:', error);
    tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center;padding:20px;color:var(--danger);"><i class="ti ti-plug-connected-x"></i> Error al conectar con el backend</div></td></tr>`;
  }
}

function aplicarFiltrosCatalogo() {
  const filtroCat = document.getElementById('filtro-categoria-prod').value;
  const filtroDest = document.getElementById('filtro-destacado-prod').value;
  const filtroActivo = document.getElementById('filtro-activo-prod').value;

  const filtrados = catalogoMemoria.filter(p => {
    if (filtroCat !== '' && String(p.categoria_id) !== filtroCat) return false;
    if (filtroDest === 'si' && !p.destacado) return false;
    if (filtroDest === 'no' && p.destacado) return false;
    if (filtroActivo === 'activo' && !p.activo) return false;
    if (filtroActivo === 'inactivo' && p.activo) return false;
    return true;
  });

  renderizarCatalogoHTML(filtrados);
}

function renderizarCatalogoHTML(productos) {
  const tbody = document.getElementById('catalogo-tbody');

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center;padding:20px;color:var(--txt-3);">No hay productos que coincidan con los filtros</div></td></tr>`;
    return;
  }

  const formatARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
  const formatFecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  tbody.innerHTML = productos.map(p => {
    const fechaLimpia = p.fecha_creacion
      ? formatFecha.format(new Date(p.fecha_creacion)).replace('.', '')
      : '';

    const pillsTalles = (p.stock_por_talle || []).map(st => {
      const clase = st.cantidad === 0 ? 'agotado' : st.cantidad <= 2 ? 'critico' : st.cantidad <= 5 ? 'bajo' : 'normal';
      const cantTexto = st.cantidad === 0 ? '✕' : st.cantidad;
      return `<span class="stock-pill ${clase}">${st.talle}: ${cantTexto}</span>`;
    }).join('');

    const swatchesColores = (p.colores_hex || []).map(hex => {
      const borde = hex?.toUpperCase() === '#FFFFFF' ? 'border:1px solid var(--border-strong);' : '';
      return `<span class="color-swatch" style="background:${hex};${borde}"></span>`;
    }).join('');

    const colorStock = p.stock_total === 0 ? 'var(--danger)' : p.stock_total <= 4 ? 'var(--warning)' : 'var(--success)';
    const imagenHTML = p.imagen_principal
      ? `<img src="${p.imagen_principal}" style="width:100%;height:100%;object-fit:cover;">`
      : `<i class="ti ti-photo" style="color:var(--txt-3)"></i>`;

    const btnEstadoTitulo = p.activo ? 'Desactivar' : 'Activar';
    const btnEstadoIcono = p.activo ? 'ti-eye-off' : 'ti-eye';
    const btnEstadoFn = p.activo
      ? `desactivarProducto(${p.id})`
      : `activarProducto(${p.id})`;

    return `
      <tr style="${p.activo ? '' : 'opacity:0.65;'}">
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="producto-thumb" style="padding:0;overflow:hidden;">${imagenHTML}</div>
            <div>
              <div style="font-weight:500">${p.nombre}</div>
              <div style="display:flex;gap:5px;margin-top:2px">
                ${!p.activo ? '<span class="badge badge-danger" style="font-size:9px">Inactivo</span>' : ''}
                <span style="font-size:11px;color:var(--txt-3)">${fechaLimpia}</span>
              </div>
            </div>
          </div>
        </td>
        <td data-label="Categoría"><span class="badge badge-neutral">${p.categoria || 'Sin categoría'}</span></td>
        <td data-label="Precio" style="font-weight:600">${formatARS.format(p.precio)}</td>
        <td data-label="Stock por talle"><div class="stock-pills">${pillsTalles || '<span style="color:var(--txt-3)">Sin variantes</span>'}</div></td>
        <td data-label="Colores">
          <div class="color-swatches">${swatchesColores}</div>
          <div style="font-size:10px;color:var(--txt-3);margin-top:3px">${(p.colores_hex || []).length} colores</div>
        </td>
        <td data-label="Stock total" style="font-weight:700;color:${colorStock}">${p.stock_total ?? 0}</td>
        <td data-label="Destacado" style="text-align:center">
          <button class="btn-destacado" style="color:${p.destacado ? '#C4703A' : 'var(--txt-3)'}"
            onclick="toggleDestacado(${p.id}, ${p.destacado})">
            ${p.destacado ? '★' : '☆'}
          </button>
        </td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" title="Editar" onclick="abrirModalProducto(${p.id})">
              <i class="ti ti-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" title="${btnEstadoTitulo}" onclick="${btnEstadoFn}">
              <i class="ti ${btnEstadoIcono}"></i>
            </button>
            <button class="btn btn-danger btn-sm" title="Eliminar definitivamente" onclick="confirmarEliminar(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ==========================================
// ACCIONES RÁPIDAS DESDE LA TABLA
// ==========================================
async function activarProducto(id) {
  try {
    const res = await fetch(`/api/v1/admin/productos/${id}/activar`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mostrarToast('Producto activado', 'ti-eye');
    await cargarCatalogoDesdeBD();
  } catch {
    mostrarToast('Error al activar el producto', 'ti-alert-triangle');
  }
}

async function desactivarProducto(id) {
  try {
    const res = await fetch(`/api/v1/admin/productos/${id}/desactivar`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mostrarToast('Producto desactivado', 'ti-eye-off');
    await cargarCatalogoDesdeBD();
  } catch {
    mostrarToast('Error al desactivar el producto', 'ti-alert-triangle');
  }
}

async function toggleDestacado(id, estadoActual) {
  try {
    const res = await fetch(`/api/v1/admin/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destacado: !estadoActual }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mostrarToast(!estadoActual ? 'Marcado como destacado ★' : 'Quitado de destacados', 'ti-star');
    await cargarCatalogoDesdeBD();
  } catch {
    mostrarToast('Error al actualizar destacado', 'ti-alert-triangle');
  }
}

function confirmarEliminar(id, nombre) {
  const ok = confirm(
    `⚠️ Eliminar definitivamente "${nombre}"?\n\nEsta acción no se puede deshacer.\nSi el producto tiene ventas registradas, el sistema no lo permitirá.`
  );
  if (ok) eliminarProducto(id);
}

async function eliminarProducto(id) {
  try {
    const res = await fetch(`/api/v1/admin/productos/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      mostrarToast('Tiene ventas registradas — usá "Desactivar"', 'ti-alert-triangle');
      return;
    }
    if (!res.ok) throw new Error(data.mensaje || `HTTP ${res.status}`);

    mostrarToast('Producto eliminado', 'ti-trash');
    await cargarCatalogoDesdeBD();
  } catch (err) {
    mostrarToast(`Error: ${err.message}`, 'ti-alert-triangle');
  }
}

// ==========================================
// MODAL DE PRODUCTO
// ==========================================
async function abrirModalProducto(id = null) {
  document.getElementById('form-producto').reset();
  document.getElementById('prod-imagenes-lista').innerHTML = '';
  agregarFilaImagen();
  variantesEnEdicion = [];
  renderizarChips('prod-talles-chips', tallesMemoria, [], 'talle');
  renderizarChips('prod-colores-chips', coloresMemoria, [], 'color');
  renderizarTablaStock([]);

  if (id) {
    document.getElementById('modal-producto-titulo').textContent = `Editar Producto #${id}`;

    // Primero buscamos en memoria; si no está, lo pedimos a la API
    let p = catalogoMemoria.find(prod => prod.id === id);
    if (!p) {
      try {
        const res = await fetch(`/api/v1/admin/productos/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        p = await res.json();
      } catch {
        mostrarToast('No se pudo cargar el producto', 'ti-alert-triangle');
        return;
      }
    }

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nombre').value = p.nombre;
    document.getElementById('prod-descripcion').value = p.descripcion || '';
    document.getElementById('prod-categoria').value = p.categoria_id || '';
    document.getElementById('prod-precio').value = p.precio;
    document.getElementById('prod-destacado').checked = p.destacado;
    document.getElementById('prod-activo').checked = p.activo;

    // Imágenes
    const imagenes = p.imagenes || (p.imagen_principal ? [{ url: p.imagen_principal }] : []);
    document.getElementById('prod-imagenes-lista').innerHTML = '';
    imagenes.length > 0 ? imagenes.forEach(img => agregarFilaImagen(img.url)) : agregarFilaImagen();

    // Chips preseleccionados + tabla de stock con datos reales
    variantesEnEdicion = p.variantes || [];
    renderizarChips('prod-talles-chips', tallesMemoria, p.talle_ids || [], 'talle');
    renderizarChips('prod-colores-chips', coloresMemoria, p.color_ids || [], 'color');
    renderizarTablaStock(variantesEnEdicion);

  } else {
    document.getElementById('modal-producto-titulo').textContent = 'Nuevo Producto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-destacado').checked = false;
    document.getElementById('prod-activo').checked = true;
  }

  document.getElementById('modal-producto').classList.add('abierto');
}

function cerrarModal(idModal, event) {
  if (!event || event.target === document.getElementById(idModal)) {
    document.getElementById(idModal).classList.remove('abierto');
  }
}

// ==========================================
// CHIPS (talles y colores)
// ==========================================
function renderizarChips(contenedorId, items, seleccionados, tipo) {
  const cont = document.getElementById(contenedorId);
  if (!items.length) {
    cont.innerHTML = `<span style="color:var(--txt-3);font-size:12px;">Sin ${tipo}s cargados</span>`;
    return;
  }
  cont.innerHTML = items.map(item => {
    const activo = seleccionados.includes(item.id) ? 'chip-activo' : '';
    const swatch = tipo === 'color' && item.hex
      ? `<span class="chip-color-swatch" style="background:${item.hex};"></span>`
      : '';
    return `<span class="chip ${activo}" data-id="${item.id}" onclick="toggleChip(this)">
              ${swatch}${item.nombre}
            </span>`;
  }).join('');
}

function toggleChip(el) {
  // Primero capturamos los stocks actuales de la tabla visible
  // para no perderlos al regenerar con la nueva selección de chips
  variantesEnEdicion = obtenerVariantesDesdeTabla();
  el.classList.toggle('chip-activo');
  renderizarTablaStock(variantesEnEdicion);
}

function obtenerChipsSeleccionados(contenedorId) {
  return [...document.querySelectorAll(`#${contenedorId} .chip.chip-activo`)]
    .map(el => Number(el.dataset.id));
}

// ==========================================
// TABLA DE STOCK POR VARIANTE (talle × color)
// ==========================================
function renderizarTablaStock(variantesExistentes = []) {
  const talles = obtenerChipsSeleccionados('prod-talles-chips').map(id => tallesMemoria.find(t => t.id === id)).filter(Boolean);
  const colores = obtenerChipsSeleccionados('prod-colores-chips').map(id => coloresMemoria.find(c => c.id === id)).filter(Boolean);
  const cont = document.getElementById('prod-stock-tabla');
  if (!cont) return;

  if (!talles.length || !colores.length) {
    cont.innerHTML = `<p style="color:var(--txt-3);font-size:12px;text-align:center;padding:12px 0;">Seleccioná al menos un talle y un color para asignar stock.</p>`;
    return;
  }

  let html = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead><tr>
      <th style="padding:6px 10px;text-align:left;color:var(--txt-3);font-weight:600;border-bottom:1px solid var(--border);">Talle / Color</th>`;
  colores.forEach(c => {
    html += `<th style="padding:6px 10px;text-align:center;color:var(--txt-3);font-weight:600;border-bottom:1px solid var(--border);">${c.nombre}</th>`;
  });
  html += `</tr></thead><tbody>`;

  talles.forEach(t => {
    html += `<tr><td style="padding:6px 10px;font-weight:600;border-bottom:1px solid var(--border);">${t.nombre}</td>`;
    colores.forEach(c => {
      const existe = variantesExistentes.find(v => v.talle_id === t.id && v.color_id === c.id);
      const stockActual = existe ? existe.stock : 0;
      html += `<td style="padding:4px 6px;border-bottom:1px solid var(--border);text-align:center;">
        <input type="number" min="0" value="${stockActual}"
          data-talle-id="${t.id}" data-color-id="${c.id}"
          class="form-control stock-variante-input">
      </td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;
}

function obtenerVariantesDesdeTabla() {
  return [...document.querySelectorAll('.stock-variante-input')].map(inp => ({
    talle_id: Number(inp.dataset.talleId),
    color_id: Number(inp.dataset.colorId),
    stock: Number(inp.value) || 0,
    activo: true,
  }));
}

// ==========================================
// FILAS DE IMÁGENES (solo URL)
// ==========================================
function agregarFilaImagen(url = '') {
  const lista = document.getElementById('prod-imagenes-lista');
  if (lista.children.length >= 6) return;

  const fila = document.createElement('div');
  fila.className = 'imagen-fila';
  const orden = lista.children.length + 1;

  fila.innerHTML = `
    <span class="imagen-orden">${orden}</span>
    <input type="text" class="form-control img-url-input" placeholder="https://..." value="${url}" style="flex:1;">
    <button type="button" class="btn-quitar-imagen" onclick="quitarFilaImagen(this)" title="Quitar">
      <i class="ti ti-x"></i>
    </button>`;

  lista.appendChild(fila);
  actualizarOrdenImagenes();
}

function quitarFilaImagen(btn) {
  btn.closest('.imagen-fila').remove();
  actualizarOrdenImagenes();
}

function actualizarOrdenImagenes() {
  document.querySelectorAll('#prod-imagenes-lista .imagen-orden')
    .forEach((span, i) => { span.textContent = i + 1; });
}

function obtenerImagenes() {
  return [...document.querySelectorAll('#prod-imagenes-lista .img-url-input')]
    .map((inp, i) => ({ url: inp.value.trim(), orden: i + 1 }))
    .filter(img => img.url !== '');
}

// ==========================================
// GUARDAR PRODUCTO (crear o actualizar)
// ==========================================
async function guardarProducto() {
  const id = document.getElementById('prod-id').value;
  const nombre = document.getElementById('prod-nombre').value.trim();
  const descripcion = document.getElementById('prod-descripcion').value.trim();
  const categoria_id = Number(document.getElementById('prod-categoria').value) || null;
  const precio = Number(document.getElementById('prod-precio').value);
  const destacado = document.getElementById('prod-destacado').checked;
  const activo = document.getElementById('prod-activo').checked;
  const imagenes = obtenerImagenes();
  const variantes = obtenerVariantesDesdeTabla();

  if (!nombre || !precio || !categoria_id) {
    mostrarToast('Completá nombre, precio y categoría', 'ti-alert-triangle');
    return;
  }

  const url = id ? `/api/v1/admin/productos/${id}` : '/api/v1/admin/productos';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, categoria_id, precio, destacado, activo, imagenes, variantes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || `HTTP ${res.status}`);
    }

    mostrarToast(id ? 'Producto actualizado ✓' : 'Producto creado ✓', 'ti-device-floppy');
    cerrarModal('modal-producto');
    await cargarCatalogoDesdeBD();
  } catch (error) {
    mostrarToast(`Error: ${error.message}`, 'ti-alert-triangle');
  }
}

// ==========================================
// STUBS — módulos pendientes de backend
// ==========================================
function mostrarPendiente(idTbody, cols) {
  document.getElementById(idTbody).innerHTML =
    `<tr><td colspan="${cols}" style="text-align:center;padding:20px;color:var(--txt-3);"><i class="ti ti-loader"></i> Módulo en desarrollo</td></tr>`;
}

async function cargarPedidosDesdeBD() { mostrarPendiente('pedidos-tbody', 8); }
async function cargarClientesDesdeBD() { mostrarPendiente('clientes-tbody', 6); }
async function cargarNewsletterDesdeBD() { mostrarPendiente('newsletter-tbody', 5); }

// ==========================================
// INICIO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('topbar-fecha').textContent = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  cargarCategorias();
  cargarTallesYColores();
  navegarA('dashboard');
});