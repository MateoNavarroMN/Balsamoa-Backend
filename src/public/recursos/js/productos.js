import { renderizarProductos, filtrarProductos, ordenarProductos } from "./funciones.js"

const contenedorProds = document.getElementById('id_contenedorProductos')
const contenedorPaginacion = document.getElementById('id_paginacion')
const formFiltros = document.getElementById('id_formFiltros')
const btnsOrden = document.querySelectorAll('.opcionOrden')

const PRODUCTOS_POR_PAGINA = 8

let productos = []
let productosFiltrados = []
let paginaActual = 1

async function iniciarPagina() {
    try {
        const respuesta = await fetch('https://69d676ce1c120e733cce4248.mockapi.io/productos-balsamoa')
        productos = await respuesta.json()
        productosFiltrados = [...productos]
        actualizarVistaProductos()
    } catch (error) {
        console.error('Error:', error)
        contenedorProds.innerHTML = '<p style="padding:40px 20px;text-align:center;color:#6B6B6B">Error al cargar los productos. Intente más tarde.</p>'
        contenedorPaginacion.innerHTML = ''
    }
}

iniciarPagina()

function actualizarVistaProductos() {
    paginaActual = 1
    renderPagina()
}

function renderPagina() {
    const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA
    const fin = Math.min(inicio + PRODUCTOS_POR_PAGINA, productosFiltrados.length)

    renderizarProductos(productosFiltrados.slice(inicio, fin), contenedorProds, true)
    renderizarPaginacion(totalPaginas)

    // Scroll suave al inicio de la grilla al cambiar de página
    contenedorProds.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function renderizarPaginacion(totalPaginas) {
    contenedorPaginacion.innerHTML = ''
    if (totalPaginas <= 1) return

    // Botón anterior
    const btnPrev = crearBoton('←', paginaActual === 1, () => {
        paginaActual--
        renderPagina()
    })
    btnPrev.classList.add('paginacion-nav')
    btnPrev.setAttribute('aria-label', 'Página anterior')
    contenedorPaginacion.appendChild(btnPrev)

    // Números de página
    generarNumeroPaginas(paginaActual, totalPaginas).forEach(p => {
        if (p === '...') {
            const span = document.createElement('span')
            span.className = 'paginacion-puntos'
            span.textContent = '…'
            contenedorPaginacion.appendChild(span)
        } else {
            const btn = crearBoton(p, false, () => {
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

    // Botón siguiente
    const btnNext = crearBoton('→', paginaActual === totalPaginas, () => {
        paginaActual++
        renderPagina()
    })
    btnNext.classList.add('paginacion-nav')
    btnNext.setAttribute('aria-label', 'Página siguiente')
    contenedorPaginacion.appendChild(btnNext)
}

function crearBoton(texto, deshabilitado, onClick) {
    const btn = document.createElement('button')
    btn.textContent = texto
    btn.className = 'paginacion-btn'
    if (deshabilitado) btn.disabled = true
    btn.addEventListener('click', onClick)
    return btn
}

function generarNumeroPaginas(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (actual <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (actual >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', actual - 1, actual, actual + 1, '...', total]
}

formFiltros.addEventListener('submit', function (e) {
    e.preventDefault()
    productosFiltrados = filtrarProductos(productos)
    actualizarVistaProductos()
    document.getElementById('id_menuFiltros').removeAttribute('open')
})

formFiltros.addEventListener('reset', function () {
    setTimeout(() => {
        productosFiltrados = [...productos]
        actualizarVistaProductos()
    }, 10)
})

btnsOrden.forEach(btn => {
    btn.addEventListener('click', function () {
        productosFiltrados = ordenarProductos(productosFiltrados, this.dataset.value)
        actualizarVistaProductos()
        document.getElementById('id_menuOrdenamientos').removeAttribute('open')
    })
})