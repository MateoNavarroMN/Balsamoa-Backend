// ==========================================
// CONTROLADORES VISUALES (UI)
// ==========================================

const TITULOS_SECCION = {
  dashboard: 'Dashboard',
  pedidos: 'Gestión de Pedidos',
  catalogo: 'Catálogo de Productos',
  clientes: 'Clientes Registrados',
  newsletter: 'Suscriptores Newsletter'
};

function navegarA(nombre) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  document.getElementById(`section-${nombre}`)?.classList.add('active');
  document.getElementById(`nav-${nombre}`)?.classList.add('active');
  document.getElementById('topbar-titulo').textContent = TITULOS_SECCION[nombre] ?? 'Panel';

  cerrarSidebar();

  if (nombre === 'catalogo') cargarCatalogo();
  if (nombre === 'pedidos') cargarPedidos();
  if (nombre === 'clientes') cargarClientes();
  if (nombre === 'newsletter') cargarNewsletter();
}

function mostrarToast(mensaje, icono = 'ti-check') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-mensaje').textContent = mensaje;
  toast.querySelector('i').className = `ti ${icono}`;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

function alternarTema() {
  const html = document.documentElement;
  const esDark = html.dataset.theme === 'dark';
  html.dataset.theme = esDark ? 'light' : 'dark';
  document.getElementById('icono-tema').className = esDark ? 'ti ti-moon' : 'ti ti-sun';
}

// ==========================================
// SIDEBAR MÓVIL — DRAWER
// ==========================================

function abrirSidebar() {
  document.querySelector('.sidebar').classList.add('open');
  document.querySelector('.sidebar-overlay').classList.add('visible');
}

function cerrarSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay').classList.remove('visible');
}

// ==========================================
// HELPER: inyectar data-label en <td>
// para la vista de tarjeta en mobile
// ==========================================
function inyectarDataLabels(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  const table = tbody?.closest('table');
  if (!table) return;

  const headers = [...table.querySelectorAll('thead th')]
    .map(th => th.textContent.trim());

  table.querySelectorAll('tbody tr').forEach(tr => {
    [...tr.querySelectorAll('td')].forEach((td, i) => {
      td.setAttribute('data-label', headers[i] ?? '');
    });
  });
}

// ==========================================
// CONEXIÓN AL BACKEND (FETCH API)
// ==========================================

async function cargarCatalogo() {
  const tbody = document.getElementById('catalogo-tbody');
  tbody.innerHTML = `
    <tr><td colspan="7">
      <div class="empty-state">
        <i class="ti ti-loader"></i>Cargando productos...
      </div>
    </td></tr>`;

  try {
    const response = await fetch('/api/admin/productos');
    const productos = await response.json();
    renderizarCatalogo(productos);
  } catch (error) {
    console.error('Error al cargar catálogo:', error);
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <i class="ti ti-plug-connected-x"></i>
          Esperando conexión con el backend...
        </div>
      </td></tr>`;
  }
}

function renderizarCatalogo(productos) {
  const tbody = document.getElementById('catalogo-tbody');

  if (!productos.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <i class="ti ti-package-off"></i>No hay productos cargados
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map(p => {
    const badgeEstado =
      p.estado === 'activo' ? 'badge-success' :
        p.estado === 'stock_critico' ? 'badge-warning' :
          p.estado === 'sin_stock' ? 'badge-danger' : 'badge-neutral';

    const labelEstado =
      p.estado === 'activo' ? 'Activo' :
        p.estado === 'stock_critico' ? 'Stock crítico' :
          p.estado === 'sin_stock' ? 'Sin stock' : p.estado;

    return `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td>${p.precio}</td>
        <td>${p.stock}</td>
        <td><span class="badge ${badgeEstado}">${labelEstado}</span></td>
        <td>
          <button class="btn btn-sm btn-outline"><i class="ti ti-edit"></i><span>Editar</span></button>
          <button class="btn btn-sm btn-danger" style="margin-left:4px"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
  }).join('');

  inyectarDataLabels('catalogo-tbody');
}

async function cargarPedidos() {
  const tbody = document.getElementById('pedidos-tbody');
  tbody.innerHTML = `
    <tr><td colspan="7">
      <div class="empty-state">
        <i class="ti ti-loader"></i>Cargando pedidos...
      </div>
    </td></tr>`;

  try {
    const response = await fetch('/api/admin/pedidos');
    const pedidos = await response.json();
    renderizarPedidos(pedidos);
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <i class="ti ti-plug-connected-x"></i>
          Esperando conexión con el backend...
        </div>
      </td></tr>`;
  }
}

function renderizarPedidos(pedidos) {
  const tbody = document.getElementById('pedidos-tbody');

  if (!pedidos.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <i class="ti ti-shopping-bag-x"></i>No hay pedidos registrados
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = pedidos.map(p => {
    const badgeEstado =
      p.estado === 'entregado' ? 'badge-success' :
        p.estado === 'en_camino' ? 'badge-info' :
          p.estado === 'pendiente' ? 'badge-warning' :
            p.estado === 'cancelado' ? 'badge-danger' : 'badge-neutral';

    const labelEstado =
      p.estado === 'entregado' ? 'Entregado' :
        p.estado === 'en_camino' ? 'En camino' :
          p.estado === 'pendiente' ? 'Pendiente' :
            p.estado === 'cancelado' ? 'Cancelado' : p.estado;

    return `
      <tr>
        <td>${p.id}</td>
        <td>${p.cliente}</td>
        <td>${p.fecha}</td>
        <td>${p.total}</td>
        <td>${p.pago}</td>
        <td><span class="badge ${badgeEstado}">${labelEstado}</span></td>
        <td>
          <button class="btn btn-sm btn-outline"><i class="ti ti-eye"></i><span>Ver</span></button>
        </td>
      </tr>`;
  }).join('');

  inyectarDataLabels('pedidos-tbody');
}

// ==========================================
// CLIENTES Y NEWSLETTER
// ==========================================

async function cargarClientes() {
  const tbody = document.getElementById('clientes-tbody');
  tbody.innerHTML = `
    <tr><td colspan="6">
      <div class="empty-state">
        <i class="ti ti-loader"></i>Cargando clientes...
      </div>
    </td></tr>`;

  try {
    const response = await fetch('/api/admin/clientes');
    const clientes = await response.json();
    renderizarClientes(clientes);
  } catch (error) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="ti ti-plug-connected-x"></i>
          Esperando conexión con el backend...
        </div>
      </td></tr>`;
  }
}

function renderizarClientes(clientes) {
  const tbody = document.getElementById('clientes-tbody');
  if (!clientes.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="ti ti-users"></i>No hay clientes registrados</div></td></tr>`;
    return;
  }
  // Acá dibujaríamos el HTML con map() cuando lleguen los datos, igual que en productos.
  inyectarDataLabels('clientes-tbody');
}

async function cargarNewsletter() {
  const tbody = document.getElementById('newsletter-tbody');
  tbody.innerHTML = `
    <tr><td colspan="5">
      <div class="empty-state">
        <i class="ti ti-loader"></i>Cargando suscriptores...
      </div>
    </td></tr>`;

  try {
    const response = await fetch('/api/admin/newsletter');
    const suscriptores = await response.json();
    renderizarNewsletter(suscriptores);
  } catch (error) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <i class="ti ti-plug-connected-x"></i>
          Esperando conexión con el backend...
        </div>
      </td></tr>`;
  }
}

function renderizarNewsletter(suscriptores) {
  const tbody = document.getElementById('newsletter-tbody');
  if (!suscriptores.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="ti ti-mail-off"></i>No hay suscriptores aún</div></td></tr>`;
    return;
  }
  // Acá dibujaríamos el HTML con map() cuando lleguen los datos.
  inyectarDataLabels('newsletter-tbody');
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-menu')
    ?.addEventListener('click', abrirSidebar);

  document.querySelector('.sidebar-overlay')
    ?.addEventListener('click', cerrarSidebar);

  navegarA('dashboard');
});