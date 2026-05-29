// ==========================================
// CONTROLADORES DE NAVEGACIÓN Y UI
// ==========================================
const TITULOS_SECCION = {
  dashboard: 'Dashboard',
  pedidos: 'Gestión de Pedidos',
  catalogo: 'Catálogo de Productos',
  clientes: 'Clientes Registrados',
  newsletter: 'Newsletter'
};

function navegarA(nombre) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  document.getElementById(`section-${nombre}`)?.classList.add('active');
  document.getElementById(`nav-${nombre}`)?.classList.add('active');
  document.getElementById('topbar-titulo').textContent = TITULOS_SECCION[nombre] ?? 'Panel';

  // Disparamos las llamadas al backend según la pestaña
  if (nombre === 'catalogo') cargarCatalogoDesdeBD();
  if (nombre === 'pedidos') cargarPedidosDesdeBD();
  if (nombre === 'clientes') cargarClientesDesdeBD();
  if (nombre === 'newsletter') cargarNewsletterDesdeBD();
  if (nombre === 'dashboard') cargarDashboardDesdeBD();
}

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
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ==========================================
// MÓDULO: CATÁLOGO (CONECTADO REAL A BD)
// ==========================================
let catalogoMemoria = []; // Memoria global para editar productos sin recargar

async function cargarCatalogoDesdeBD() {
  const tbody = document.getElementById('catalogo-tbody');
  tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center; padding:20px; color:var(--txt-3);"><i class="ti ti-loader"></i> Cargando productos...</div></td></tr>`;

  try {
    const response = await fetch('/api/v1/productos');
    const productos = await response.json();

    // Si la BD devuelve error
    if (productos.mensaje) throw new Error(productos.mensaje);

    catalogoMemoria = productos;
    aplicarFiltrosCatalogo();
  } catch (error) {
    console.error('Error:', error);
    tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center; padding:20px; color:var(--danger);"><i class="ti ti-plug-connected-x"></i> Error al conectar con el backend</div></td></tr>`;
  }
}

// ==========================================
// LÓGICA DE FILTROS DEL CATÁLOGO
// ==========================================
function aplicarFiltrosCatalogo() {
  const filtroCat = document.getElementById('filtro-categoria-prod').value;
  const filtroDest = document.getElementById('filtro-destacado-prod').value;
  const filtroActivo = document.getElementById('filtro-activo-prod').value;

  // Filtramos la memoria global sin tocar la base de datos
  const productosFiltrados = catalogoMemoria.filter(p => {

    // Filtro 1: Categoría
    if (filtroCat !== '' && p.categoria !== filtroCat) return false;

    // Filtro 2: Destacados
    if (filtroDest === 'si' && p.destacado === false) return false;
    if (filtroDest === 'no' && p.destacado === true) return false;

    // Filtro 3: Activos / Inactivos
    if (filtroActivo === 'activo' && p.activo === false) return false;
    if (filtroActivo === 'inactivo' && p.activo === true) return false;

    return true; // Si pasa todos los filtros, lo mostramos
  });

  // Le mandamos la lista filtrada a la función que ya dibuja la tabla
  renderizarCatologoHTML(productosFiltrados);
}

function renderizarCatologoHTML(productos) {
  const tbody = document.getElementById('catalogo-tbody');
  if (productos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div style="text-align:center; padding:20px; color:var(--txt-3);">No hay productos registrados</div></td></tr>`;
    return;
  }

  const formatARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
  const formatFecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  tbody.innerHTML = productos.map(p => {
    let fechaLimpia = p.fecha_creacion ? formatFecha.format(new Date(p.fecha_creacion)).replace('.', '') : '';

    const pillsTalles = p.stock_por_talle.map(st => {
      let clase = st.cantidad === 0 ? 'agotado' : st.cantidad <= 2 ? 'critico' : st.cantidad <= 5 ? 'bajo' : 'normal';
      let cantTexto = st.cantidad === 0 ? '✕' : st.cantidad;
      return `<span class="stock-pill ${clase}">${st.talle}: ${cantTexto}</span>`;
    }).join('');

    const swatchesColores = p.colores_hex.map(hex => {
      const borde = hex.toUpperCase() === '#FFFFFF' ? 'border: 1px solid var(--border-strong);' : '';
      return `<span class="color-swatch" style="background:${hex}; ${borde}"></span>`;
    }).join('');

    const colorStock = p.stock_total === 0 ? 'var(--danger)' : p.stock_total <= 4 ? 'var(--warning)' : 'var(--success)';
    const imagenHTML = p.imagen_principal ? `<img src="${p.imagen_principal}" style="width:100%;height:100%;object-fit:cover;">` : `<i class="ti ti-photo" style="color:var(--txt-3)"></i>`;

    return `
      <tr style="${p.activo ? '' : 'opacity: 0.65;'}">
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="producto-thumb" style="padding:0; overflow:hidden;">${imagenHTML}</div>
            <div>
              <div style="font-weight:500">${p.nombre}</div>
              <div style="display:flex;gap:5px;margin-top:2px">
                ${!p.activo ? '<span class="badge badge-danger" style="font-size:9px">Inactivo</span>' : ''}
                <span style="font-size:11px;color:var(--txt-3)">${fechaLimpia}</span>
              </div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-neutral">${p.categoria || 'Sin Categoría'}</span></td>
        <td style="font-weight:600">${formatARS.format(p.precio)}</td>
        <td><div class="stock-pills">${pillsTalles || '<span style="color:var(--txt-3)">Sin variantes</span>'}</div></td>
        <td>
          <div class="color-swatches">${swatchesColores}</div>
          <div style="font-size:10px;color:var(--txt-3);margin-top:3px">${p.colores_hex.length} colores</div>
        </td>
        <td style="font-weight:700;color:${colorStock}">${p.stock_total}</td>
        <td style="text-align:center"><button class="btn-destacado" style="color:${p.destacado ? '#C4703A' : 'var(--txt-3)'}">${p.destacado ? '★' : '☆'}</button></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="abrirModalProducto(${p.id})"><i class="ti ti-edit"></i></button>
            <button class="btn btn-danger btn-sm" onclick="mostrarToast('Eliminado lógico pendiente', 'ti-trash')"><i class="ti ti-${p.activo ? 'eye-off' : 'eye'}"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ==========================================
// MODAL DE PRODUCTO (CONECTADO A GET /api/v1/productos/:id)
// ==========================================
async function abrirModalProducto(id = null) {
  const modal = document.getElementById('modal-producto');
  document.getElementById('form-producto').reset();

  if (id) {
    document.getElementById('modal-producto-titulo').textContent = 'Editar Producto #' + id;

    // Intentamos primero desde la memoria para respuesta inmediata
    let p = catalogoMemoria.find(prod => prod.id === id);

    // Si no está en memoria o queremos datos frescos, consultamos la API
    if (!p) {
      try {
        const res = await fetch(`/api/v1/productos/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        p = await res.json();
      } catch (error) {
        console.error('Error al cargar producto:', error);
        mostrarToast('No se pudo cargar el producto', 'ti-plug-connected-x');
        return;
      }
    }

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nombre').value = p.nombre;
    document.getElementById('prod-descripcion').value = p.descripcion || '';
    document.getElementById('prod-categoria').value = p.categoria_id || '';
    document.getElementById('prod-precio').value = p.precio;
    document.getElementById('prod-imagen').value = p.imagen_principal || '';
    document.getElementById('prod-destacado').checked = p.destacado;
    document.getElementById('prod-activo').checked = p.activo;

  } else {
    document.getElementById('modal-producto-titulo').textContent = 'Nuevo Producto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-destacado').checked = false;
    document.getElementById('prod-activo').checked = true;
  }

  modal.classList.add('abierto');
}

function cerrarModal(idModal, event) {
  if (!event || event.target === document.getElementById(idModal)) {
    document.getElementById(idModal).classList.remove('abierto');
  }
}

async function guardarProducto() {
  const id = document.getElementById('prod-id').value;

  const body = {
    nombre:      document.getElementById('prod-nombre').value.trim(),
    descripcion: document.getElementById('prod-descripcion').value.trim(),
    categoria_id: Number(document.getElementById('prod-categoria').value) || null,
    precio:      Number(document.getElementById('prod-precio').value),
    imagen_principal: document.getElementById('prod-imagen').value.trim() || null,
    destacado:   document.getElementById('prod-destacado').checked,
    activo:      document.getElementById('prod-activo').checked,
  };

  const url    = id ? `/api/v1/productos/${id}` : '/api/v1/productos';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || `HTTP ${res.status}`);
    }

    mostrarToast(id ? 'Producto actualizado' : 'Producto creado', 'ti-device-floppy');
    cerrarModal('modal-producto');
    await cargarCatalogoDesdeBD(); // recargamos la tabla con los datos frescos
  } catch (error) {
    console.error('Error al guardar producto:', error);
    mostrarToast(`Error: ${error.message}`, 'ti-alert-triangle');
  }
}

// ==========================================
// MÓDULOS EN ESPERA DE BACKEND (STUBS)
// ==========================================
function mostrarCargando(idTbody) {
  document.getElementById(idTbody).innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px; color:var(--txt-3);"><i class="ti ti-loader"></i> Esperando conexión con la API...</td></tr>`;
}

async function cargarPedidosDesdeBD() { mostrarCargando('pedidos-tbody'); }
async function cargarClientesDesdeBD() { mostrarCargando('clientes-tbody'); }
async function cargarNewsletterDesdeBD() { mostrarCargando('newsletter-tbody'); }
async function cargarDashboardDesdeBD() { /* Los KPIs mostrarán '...' hasta que se arme la API */ }

// ==========================================
// INICIO AUTOMÁTICO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('topbar-fecha').textContent = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  navegarA('dashboard');
});