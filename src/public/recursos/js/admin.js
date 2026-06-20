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

function leerCookie(nombre) {
  const match = document.cookie.match(new RegExp('(^| )' + nombre + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

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

function alternarTema() {
  const html = document.documentElement;
  const esDark = html.dataset.theme === 'dark';
  const nuevoTema = esDark ? 'light' : 'dark';
  
  // Cambiamos el atributo en el HTML y el ícono
  html.dataset.theme = nuevoTema;
  document.getElementById('icono-tema').className = nuevoTema === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  
  // Guardamos la preferencia en la memoria del navegador
  localStorage.setItem('balsamoa_tema_admin', nuevoTema);
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
let variantesEnEdicion = [];

// ==========================================
// INICIO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  const temaGuardado = localStorage.getItem('balsamoa_tema_admin') || 'light';
  document.documentElement.dataset.theme = temaGuardado;
  const iconoTema = document.getElementById('icono-tema');
  if (iconoTema) {
    iconoTema.className = temaGuardado === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  }

  document.getElementById('topbar-fecha').textContent = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  
  // Leemos el nombre que nos mandó el backend
  const nombreGuardado = leerCookie('usuario_nombre') || 'Administrador';
  document.getElementById('nombre-usuario-sidebar').textContent = nombreGuardado;
  
  document.getElementById('avatar-usuario-sidebar').textContent = nombreGuardado.substring(0, 2).toUpperCase();

  cargarCategorias();
  cargarTallesYColores();
  navegarA('catalogo');
});

// ==========================================
// SEGURIDAD Y SESIÓN
// ==========================================
async function cerrarSesion() {
  try {
    const res = await fetch('/api/v1/autenticacion/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/login';
    }
  } catch (error) {
    mostrarToast('Error al cerrar sesión', 'ti-alert-triangle');
  }
}

// ==========================================
// CARGA INICIAL (Protegida)
// ==========================================
async function cargarCategorias() {
  try {
    const res = await fetch('/api/v1/admin/categorias');
    // 🛡️ INTERCEPTOR: Si no hay token, lo mandamos al login al instante
    if (res.status === 401 || res.status === 403) return window.location.href = '/login';
    
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
    
    // 🛡️ INTERCEPTOR MÚLTIPLE
    if (resTalles.status === 401 || resColores.status === 401) return window.location.href = '/login';

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
    
    // 🛡️ INTERCEPTOR DEL CATÁLOGO
    if (res.status === 401 || res.status === 403) return window.location.href = '/login';

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
  document.getElementById('confirm-nombre').textContent = nombre;
  document.getElementById('confirm-btn-ok').onclick = () => {
    cerrarModal('modal-confirmar');
    eliminarProducto(id);
  };
  document.getElementById('modal-confirmar').classList.add('abierto');
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

    mostrarToast('Producto e imágenes eliminados', 'ti-trash');
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
  variantesEnEdicion = [];
  renderizarChips('prod-talles-chips', tallesMemoria, [], 'talle');
  renderizarChips('prod-colores-chips', coloresMemoria, [], 'color');
  renderizarTablaStock([]);

  if (id) {
    document.getElementById('modal-producto-titulo').textContent = `Editar Producto #${id}`;

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

    // Imágenes — cargar filas con previsualizaciones
    const imagenes = p.imagenes || (p.imagen_principal ? [{ url: p.imagen_principal }] : []);
    document.getElementById('prod-imagenes-lista').innerHTML = '';
    if (imagenes.length > 0) {
      imagenes.forEach(img => agregarFilaImagen(img.url));
    } else {
      agregarFilaImagen();
    }

    // Chips + tabla de stock
    variantesEnEdicion = p.variantes || [];
    renderizarChips('prod-talles-chips', tallesMemoria, p.talle_ids || [], 'talle');
    renderizarChips('prod-colores-chips', coloresMemoria, p.color_ids || [], 'color');
    renderizarTablaStock(variantesEnEdicion);

  } else {
    document.getElementById('modal-producto-titulo').textContent = 'Nuevo Producto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-destacado').checked = false;
    document.getElementById('prod-activo').checked = true;
    agregarFilaImagen();
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
// FILAS DE IMÁGENES — subida real al servidor
// ==========================================

/**
 * Agrega una fila de imagen al modal.
 * Si se pasa una URL (imagen existente), muestra previsualización y botón de quitar.
 * Si no, muestra el input de archivo para subir una nueva.
 */
function agregarFilaImagen(urlExistente = '') {
  const lista = document.getElementById('prod-imagenes-lista');
  if (lista.children.length >= 6) {
    mostrarToast('Máximo 6 imágenes por producto', 'ti-alert-triangle');
    return;
  }

  const fila = document.createElement('div');
  fila.className = 'imagen-fila';
  const orden = lista.children.length + 1;

  if (urlExistente) {
    // Imagen ya subida: mostrar miniatura + URL + botón quitar
    fila.innerHTML = `
      <span class="imagen-orden">${orden}</span>
      <img src="${urlExistente}" alt="Imagen ${orden}"
           style="width:40px;height:40px;object-fit:cover;border-radius:5px;border:1px solid var(--border);flex-shrink:0;">
      <input type="text" class="form-control img-url-input" value="${urlExistente}" readonly
             style="flex:1;font-size:11px;color:var(--txt-3);">
      <button type="button" class="btn-quitar-imagen" onclick="quitarFilaImagen(this)" title="Quitar imagen">
        <i class="ti ti-x"></i>
      </button>`;
  } else {
    // Nueva imagen: mostrar input de archivo
    const inputId = `img-file-${Date.now()}`;
    fila.innerHTML = `
      <span class="imagen-orden">${orden}</span>
      <input type="file" id="${inputId}" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;"
             onchange="previsualizarYSubir(this)">
      <label for="${inputId}" class="btn btn-outline btn-sm" style="cursor:pointer;">
        <i class="ti ti-upload"></i> Elegir imagen
      </label>
      <span class="img-nombre-archivo" style="flex:1;font-size:11px;color:var(--txt-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        Sin archivo seleccionado
      </span>
      <input type="hidden" class="img-url-input" value="">
      <button type="button" class="btn-quitar-imagen" onclick="quitarFilaImagen(this)" title="Quitar">
        <i class="ti ti-x"></i>
      </button>`;
  }

  lista.appendChild(fila);
  actualizarOrdenImagenes();
}

/**
 * Cuando el usuario elige un archivo:
 * 1. Muestra el nombre del archivo y una miniatura
 * 2. Sube el archivo al servidor vía /api/v1/admin/imagenes/subir
 * 3. Guarda la URL devuelta en el campo oculto img-url-input
 */
async function previsualizarYSubir(input) {
  const fila = input.closest('.imagen-fila');
  const archivo = input.files[0];
  if (!archivo) return;

  const labelSpan = fila.querySelector('.img-nombre-archivo');
  const urlInput = fila.querySelector('.img-url-input');
  const labelBtn = fila.querySelector('label.btn');

  // Mostrar estado de carga
  labelSpan.textContent = 'Subiendo...';
  labelBtn.innerHTML = '<i class="ti ti-loader"></i> Subiendo...';
  labelBtn.style.pointerEvents = 'none';

  // Previsualización local inmediata
  const reader = new FileReader();
  reader.onload = (e) => {
    // Insertar miniatura si no existe
    let miniatura = fila.querySelector('.img-preview-mini');
    if (!miniatura) {
      miniatura = document.createElement('img');
      miniatura.className = 'img-preview-mini';
      miniatura.style.cssText = 'width:40px;height:40px;object-fit:cover;border-radius:5px;border:1px solid var(--border);flex-shrink:0;';
      fila.insertBefore(miniatura, labelBtn);
    }
    miniatura.src = e.target.result;
  };
  reader.readAsDataURL(archivo);

  // Subir al servidor
  try {
    const formData = new FormData();
    formData.append('imagen', archivo);

    const res = await fetch('/api/v1/admin/imagenes/subir', {
      method: 'POST',
      body: formData
      // No poner Content-Type: el browser lo setea automáticamente con el boundary
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || `HTTP ${res.status}`);
    }

    const data = await res.json();

    // Guardar la URL pública devuelta por el servidor
    urlInput.value = data.url;
    labelSpan.textContent = archivo.name;
    labelBtn.innerHTML = '<i class="ti ti-check"></i> Subida';
    labelBtn.style.cssText += 'color:var(--success);border-color:var(--success);pointer-events:none;';

  } catch (err) {
    labelSpan.textContent = 'Error al subir';
    labelBtn.innerHTML = '<i class="ti ti-alert-triangle"></i> Reintentar';
    labelBtn.style.pointerEvents = 'auto';
    urlInput.value = '';
    mostrarToast(`Error al subir imagen: ${err.message}`, 'ti-alert-triangle');
  }
}

function quitarFilaImagen(btn) {
  btn.closest('.imagen-fila').remove();
  actualizarOrdenImagenes();
}

function actualizarOrdenImagenes() {
  document.querySelectorAll('#prod-imagenes-lista .imagen-orden')
    .forEach((span, i) => { span.textContent = i + 1; });
}

/**
 * Recolecta todas las URLs ya subidas del modal.
 * Solo incluye filas que tienen un img-url-input con valor (subida exitosa o existente).
 */
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

  // Verificar si hay imágenes pendientes de subida (elegidas pero no subidas aún)
  const filasConArchivo = [...document.querySelectorAll('#prod-imagenes-lista input[type="file"]')]
    .filter(inp => inp.files && inp.files.length > 0);
  const filasSubidas = [...document.querySelectorAll('#prod-imagenes-lista .img-url-input')]
    .filter(inp => inp.value === '' && inp.closest('.imagen-fila').querySelector('input[type="file"]'));

  if (filasSubidas.length > 0) {
    mostrarToast('Esperá que terminen de subirse las imágenes', 'ti-alert-triangle');
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
  navegarA('catalogo');
});