const API_DESTACADOS = '/api/v1/tienda/productos?destacados=true'
const contenedorProdsDest = document.getElementById('id_contenedorProductosDestacados')

// ── Scroll-reveal del header ─────────────────────────────────
window.addEventListener('scroll', () => {
    document.querySelector('.encabezadoPrincipal')
        ?.classList.toggle('scrolled', window.scrollY > 10)
}, { passive: true })

// ── Helpers ──────────────────────────────────────────────────

/**
 * Devuelve las clases y el texto del badge de disponibilidad.
 * @param {string} disponibilidad  - "Disponible" | "Últimas unidades" | "Agotado"
 * @returns {{ clase: string, texto: string } | null}
 */
function getBadgeDisponibilidad(disponibilidad) {
    const mapa = {
        'Agotado':          { clase: 'badge--agotado',  texto: 'Agotado' },
        'Últimas unidades': { clase: 'badge--ultimas',  texto: 'Últimas unidades' },
        'Disponible':       { clase: 'badge--disponible', texto: 'Disponible' },
    }
    return mapa[disponibilidad] ?? null
}

/**
 * Genera el HTML de una tarjeta de producto para el index.
 * @param {Object} producto
 */
function crearTarjetaDestacado(producto) {
    const badge = getBadgeDisponibilidad(producto.disponibilidad)
    const badgeHTML = badge
        ? `<span class="cardBadge ${badge.clase}">${badge.texto}</span>`
        : ''

    // Precio formateado en pesos argentinos
    const precioFormateado = `$${Number(producto.precio).toLocaleString('es-AR')}`

    // Primer color del array, si existe
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

// Muestra un mensaje amigable cuando no hay destacados.
function mostrarSinDestacados() {
    contenedorProdsDest.innerHTML = `
        <div class="sinResultados">
            <span class="sinResultadosIcono">✦</span>
            <p>No hay productos destacados en este momento.</p>
            <a href="./productos.html" class="btnVerProductos" style="margin-top:12px">
                Ver catálogo completo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </a>
        </div>
    `
}

// Muestra un mensaje de error de red.
function mostrarErrorDestacados() {
    contenedorProdsDest.innerHTML = `
        <div class="sinResultados">
            <span class="sinResultadosIcono">⚠️</span>
            <p>No pudimos cargar los productos. Intentá de nuevo más tarde.</p>
        </div>
    `
}

// ── Carga principal
async function cargarProductosDestacados() {
    try {
        const respuesta = await fetch(API_DESTACADOS)

        // El backend siempre responde 200; cualquier otro código es error de red/servidor
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

        const productos = await respuesta.json()

        // Regla 1: array vacío → mensaje amigable, sin throw
        if (!Array.isArray(productos) || productos.length === 0) {
            mostrarSinDestacados()
            return
        }

        contenedorProdsDest.innerHTML = productos
            .map(crearTarjetaDestacado)
            .join('')

    } catch (error) {
        console.error('[Balsamoa] Error cargando destacados:', error)
        mostrarErrorDestacados()
    }
}

cargarProductosDestacados()