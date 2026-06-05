const API_PRODUCTOS = '/api/v1/tienda/productos'

const contenedorProds = document.getElementById('id_contenedorProductos')
const contenedorPaginacion = document.getElementById('id_paginacion')
const formFiltros = document.getElementById('id_formFiltros')
const btnsOrden = document.querySelectorAll('.opcionOrden')
const selectCategoria = document.getElementById('id_selectCategoria')
const talleFiltroForm = document.getElementById('id_formFiltros')

const PRODUCTOS_POR_PAGINA = 8

let todosLosProductos = []   // catálogo completo en memoria
let productosFiltrados = []   // resultado del filtro activo
let paginaActual = 1
let ordenActual = null // string del criterio de orden

// ── Scroll-reveal del header
window.addEventListener('scroll', () => {
    document.querySelector('.encabezadoPrincipal')
        ?.classList.toggle('scrolled', window.scrollY > 10)
}, { passive: true })

// ── Helpers

function getBadgeDisponibilidad(disponibilidad) {
    const mapa = {
        'Agotado': { clase: 'badge--agotado', texto: 'Agotado' },
        'Últimas unidades': { clase: 'badge--ultimas', texto: 'Últimas unidades' },
        'Disponible': { clase: 'badge--disponible', texto: 'Disponible' },
    }
    return mapa[disponibilidad] ?? null
}

/**
 * Genera el HTML de una tarjeta de producto para la grilla del catálogo.
 */
function crearTarjeta(producto) {
    const badge = getBadgeDisponibilidad(producto.disponibilidad)
    const badgeHTML = badge
        ? `<span class="cardBadge ${badge.clase}">${badge.texto}</span>`
        : ''

    const precioFormateado = `$${Number(producto.precio).toLocaleString('es-AR')}`

    // Regla: círculos de colores desde colores_hex
    const coloresHTML = Array.isArray(producto.colores_hex) && producto.colores_hex.length
        ? `<div class="cardColores">
               ${producto.colores_hex.map(hex =>
            `<span class="colorCirculo" style="background-color:${hex}" title="${hex}"></span>`
        ).join('')}
           </div>`
        : ''

    return `
        <article>
            <a href="./producto.html?id=${producto.id}">
                <div class="imgWrap">
                    ${badgeHTML}
                    <img
                        src="${producto.imagen_principal || ''}"
                        alt="${producto.nombre}"
                        loading="lazy"
                    >
                </div>
                <div class="cardInfo">
                    <h3>${producto.nombre}</h3>
                    ${coloresHTML}
                    <p>${precioFormateado}</p>
                </div>
            </a>
        </article>
    `
}

function mostrarSinResultados() {
    contenedorProds.innerHTML = `
        <div class="sinResultados">
            <span class="sinResultadosIcono">✦</span>
            <p>No encontramos productos con esos filtros.</p>
            <button class="btnLimpiarFiltros" type="button" onclick="limpiarFiltros()">
                Limpiar filtros
            </button>
        </div>
    `
    contenedorPaginacion.innerHTML = ''
}

function mostrarErrorCatalogo() {
    contenedorProds.innerHTML = `
        <div class="sinResultados">
            <span class="sinResultadosIcono">⚠️</span>
            <p>Error al cargar los productos. Intentá de nuevo más tarde.</p>
        </div>
    `
    contenedorPaginacion.innerHTML = ''
}

// ── Poblado dinámico del select de categorías

/**
 * Extrae categorías únicas del catálogo y puebla el <select>.
 */
function poblarCategorias(productos) {
    if (!selectCategoria) return   // guard: si el HTML aún no tiene el select

    const categorias = [...new Set(
        productos
            .map(p => p.categoria)
            .filter(Boolean)
    )].sort()

    // Vaciamos opciones previas salvo la primera ("Todas")
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>'

    categorias.forEach(cat => {
        const opt = document.createElement('option')
        opt.value = cat
        opt.textContent = cat
        selectCategoria.appendChild(opt)
    })
}

// ── Filtros

// ── Comportamiento inteligente de los menú desplegables ──
const menusColapsables = document.querySelectorAll('.menuColapsable')

document.addEventListener('click', (evento) => {
    // Verificamos si el clic ocurrió adentro de algún menú
    const menuClickeado = evento.target.closest('.menuColapsable')

    menusColapsables.forEach(menu => {
        // Si el usuario hizo clic en la página (fuera de los menú), cerramos todos.
        if (!menuClickeado) {
            menu.removeAttribute('open')
        } 
        // Si el usuario hizo clic en un menú, cerramos los *otros* menú para que no se superpongan.
        else if (menu !== menuClickeado) {
            menu.removeAttribute('open')
        }
    })
})

function aplicarFiltros() {
    const data = new FormData(formFiltros)
    const talles = data.getAll('talle')
    const desde = parseFloat(data.get('precio-desde')) || 0
    const hasta = parseFloat(data.get('precio-hasta')) || Infinity
    const catSel = selectCategoria?.value ?? ''

    productosFiltrados = todosLosProductos.filter(p => {
        // Precio
        const precio = Number(p.precio)
        if (precio < desde || precio > hasta) return false

        // Categoría
        if (catSel && p.categoria !== catSel) return false

        // Talle: el producto debe tener al menos uno de los talles
        // seleccionados con tieneStock === true
        if (talles.length > 0) {
            const stockArr = Array.isArray(p.stock_por_talle) ? p.stock_por_talle : []
            const tieneAlguno = talles.some(talle =>
                stockArr.some(s => s.talle === talle && s.tieneStock === true)
            )
            if (!tieneAlguno) return false
        }

        return true
    })

    // Reaplicar el orden activo sobre los filtrados
    if (ordenActual) {
        productosFiltrados = ordenarProductos(productosFiltrados, ordenActual)
    }
}

// ── Ordenamiento

function ordenarProductos(lista, criterio) {
    const copia = [...lista]
    switch (criterio) {
        case 'precioAsc':
            return copia.sort((a, b) => Number(a.precio) - Number(b.precio))
        case 'precioDesc':
            return copia.sort((a, b) => Number(b.precio) - Number(a.precio))
        case 'masNuevo':
            return copia.sort((a, b) => new Date(b.fecha_creacion ?? 0) - new Date(a.fecha_creacion ?? 0))
        case 'masAntiguo':
            return copia.sort((a, b) => new Date(a.fecha_creacion ?? 0) - new Date(b.fecha_creacion ?? 0))
        default:
            return copia
    }
}

// ── Paginación

function renderPagina() {
    const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)

    if (productosFiltrados.length === 0) {
        mostrarSinResultados()
        return
    }

    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA
    const fin = Math.min(inicio + PRODUCTOS_POR_PAGINA, productosFiltrados.length)
    const pagina = productosFiltrados.slice(inicio, fin)

    contenedorProds.innerHTML = pagina.map(crearTarjeta).join('')
    renderizarPaginacion(totalPaginas)

    // Scroll suave al encabezado de la grilla al cambiar de página
    contenedorProds.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function actualizarVistaProductos() {
    paginaActual = 1
    renderPagina()
}

function renderizarPaginacion(totalPaginas) {
    contenedorPaginacion.innerHTML = ''
    if (totalPaginas <= 1) return

    const btnPrev = crearBotonPag('←', paginaActual === 1, () => {
        paginaActual--
        renderPagina()
    })
    btnPrev.classList.add('paginacion-nav')
    btnPrev.setAttribute('aria-label', 'Página anterior')
    contenedorPaginacion.appendChild(btnPrev)

    generarNumeroPaginas(paginaActual, totalPaginas).forEach(p => {
        if (p === '...') {
            const span = document.createElement('span')
            span.className = 'paginacion-puntos'
            span.textContent = '…'
            contenedorPaginacion.appendChild(span)
        } else {
            const btn = crearBotonPag(p, false, () => {
                paginaActual = p
                renderPagina()
            })
            if (p === paginaActual) {
                btn.classList.add('activo')
                btn.setAttribute('aria-current', 'page')
            }
            contenedorPaginacion.appendChild(btn)
        }
    })

    const btnNext = crearBotonPag('→', paginaActual === totalPaginas, () => {
        paginaActual++
        renderPagina()
    })
    btnNext.classList.add('paginacion-nav')
    btnNext.setAttribute('aria-label', 'Página siguiente')
    contenedorPaginacion.appendChild(btnNext)
}

function crearBotonPag(texto, deshabilitado, onClick) {
    const btn = document.createElement('button')
    btn.textContent = texto
    btn.className = 'paginacion-btn'
    if (deshabilitado) btn.disabled = true
    else btn.addEventListener('click', onClick)
    return btn
}

function generarNumeroPaginas(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (actual <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (actual >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', actual - 1, actual, actual + 1, '...', total]
}

// ── Limpiar filtros (expuesto globalmente para el botón inline)
function limpiarFiltros() {
    formFiltros.reset()
    if (selectCategoria) selectCategoria.value = ''
    ordenActual = null
    productosFiltrados = [...todosLosProductos]
    actualizarVistaProductos()
}
window.limpiarFiltros = limpiarFiltros   // acceso desde el atributo onclick del HTML

// ── Eventos

formFiltros.addEventListener('submit', function (e) {
    e.preventDefault()
    aplicarFiltros()
    actualizarVistaProductos()
    document.getElementById('id_menuFiltros').removeAttribute('open')
})

formFiltros.addEventListener('reset', function () {
    setTimeout(() => {
        if (selectCategoria) selectCategoria.value = ''
        productosFiltrados = ordenActual
            ? ordenarProductos([...todosLosProductos], ordenActual)
            : [...todosLosProductos]
        actualizarVistaProductos()
    }, 10)
})

btnsOrden.forEach(btn => {
    btn.addEventListener('click', function () {
        ordenActual = this.dataset.value
        productosFiltrados = ordenarProductos(productosFiltrados, ordenActual)
        actualizarVistaProductos()
        document.getElementById('id_menuOrdenamientos').removeAttribute('open')
    })
})

if (selectCategoria) {
    selectCategoria.addEventListener('change', () => {
        aplicarFiltros()
        actualizarVistaProductos()
    })
}

// ── Carga inicial
async function iniciarPagina() {
    try {
        const respuesta = await fetch(API_PRODUCTOS)
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

        const productos = await respuesta.json()

        // Regla 1: array vacío → mensaje amigable
        if (!Array.isArray(productos) || productos.length === 0) {
            contenedorProds.innerHTML = `
                <div class="sinResultados">
                    <span class="sinResultadosIcono">✦</span>
                    <p>El catálogo está vacío por el momento.</p>
                </div>
            `
            contenedorPaginacion.innerHTML = ''
            return
        }

        todosLosProductos = productos
        productosFiltrados = [...productos]

        // Poblar categorías dinámicamente
        poblarCategorias(productos)

        actualizarVistaProductos()

    } catch (error) {
        console.error('[Balsamoa] Error cargando catálogo:', error)
        mostrarErrorCatalogo()
    }
}

iniciarPagina()