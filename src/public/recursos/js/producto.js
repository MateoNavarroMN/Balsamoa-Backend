const API_BASE    = '/api/v1/tienda/productos'
const WS_NUMERO   = '549111111111'

// ── Parámetros de URL
const params     = new URLSearchParams(window.location.search)
const productoId = params.get('id')

// ── Referencias DOM
const skeleton          = document.getElementById('js_skeleton')
const contenidoDetalle  = document.getElementById('js_contenidoDetalle')
const errorEl           = document.getElementById('js_error')

const carruselTrack     = document.getElementById('js_carruselTrack')
const thumbsContainer   = document.getElementById('js_thumbs')

const nombreEl          = document.getElementById('js_nombre')
const precioEl          = document.getElementById('js_precio')
const descripcionEl     = document.getElementById('js_descripcion')
const badgeEl           = document.getElementById('js_badge')

const tallesEl          = document.getElementById('js_talles')
const talleSeleccionado = document.getElementById('js_talleSeleccionado')

const btnWsp            = document.getElementById('js_btnWhatsapp')
const btnComprar        = document.getElementById('js_btnComprar')

const relacionadosEl    = document.getElementById('js_relacionados')

// ── Estado
let talleActual    = null
let imagenActual   = 0
let imagenesCarr   = []

// ── Scroll-reveal del header
window.addEventListener('scroll', () => {
    document.querySelector('.encabezadoPrincipal')
        ?.classList.toggle('scrolled', window.scrollY > 10)
}, { passive: true })

// ── Helpers

function getBadgeDisponibilidad(disponibilidad) {
    const mapa = {
        'Agotado':          { clase: 'badge--agotado',    texto: 'Agotado' },
        'Últimas unidades': { clase: 'badge--ultimas',    texto: 'Últimas unidades' },
        'Disponible':       { clase: 'badge--disponible', texto: 'Disponible' },
    }
    return mapa[disponibilidad] ?? null
}

function mostrarToast(mensaje) {
    let toast = document.getElementById('js_toast')
    if (!toast) {
        toast = document.createElement('div')
        toast.id = 'js_toast'
        toast.className = 'toast'
        document.body.appendChild(toast)
    }
    toast.textContent = mensaje
    toast.classList.add('visible')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 3000)
}

function shakeElemento(el) {
    el.classList.add('shake')
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true })
}

function mostrarError(msg) {
    if (skeleton) skeleton.style.display = 'none'
    if (contenidoDetalle) contenidoDetalle.style.display = 'none'
    if (errorEl) {
        errorEl.style.display = 'flex'
        const p = errorEl.querySelector('p')
        if (p) p.textContent = msg
    }
}

// ── Carrusel de imágenes

/**
 * Inicializa el carrusel con el array de imágenes del producto.
 * Cada imagen puede ser un objeto { src, alt } o un string de URL.
 * @param {Array} imagenes
 */
function inicializarCarrusel(imagenes) {
    imagenesCarr = imagenes
    if (!carruselTrack) return

    // Renderizar slides
    carruselTrack.innerHTML = imagenes.map((img, i) => {
        const src = typeof img === 'string' ? img : img.url
        const alt = typeof img === 'string' ? '' : (img.alt ?? '')
        return `
            <div class="carruselSlide${i === 0 ? ' activo' : ''}">
                <img src="${src}" alt="${alt}" loading="${i === 0 ? 'eager' : 'lazy'}">
            </div>
        `
    }).join('')

    // Renderizar thumbnails si el contenedor existe
    if (thumbsContainer) {
        thumbsContainer.innerHTML = imagenes.map((img, i) => {
            const src = typeof img === 'string' ? img : img.url
            const alt = typeof img === 'string' ? '' : (img.alt ?? '')
            return `
                <button
                    type="button"
                    class="thumb${i === 0 ? ' activo' : ''}"
                    data-index="${i}"
                    aria-label="Ver imagen ${i + 1}"
                >
                    <img src="${src}" alt="${alt}" loading="lazy">
                </button>
            `
        }).join('')

        thumbsContainer.querySelectorAll('.thumb').forEach(btn => {
            btn.addEventListener('click', () => irASlide(Number(btn.dataset.index)))
        })
    }

    imagenActual = 0

    // Eventos de navegación del carrusel
    document.getElementById('js_btnCarrPrev')?.addEventListener('click', () => {
        irASlide((imagenActual - 1 + imagenesCarr.length) % imagenesCarr.length)
    })
    document.getElementById('js_btnCarrNext')?.addEventListener('click', () => {
        irASlide((imagenActual + 1) % imagenesCarr.length)
    })
}

function irASlide(indice) {
    const slides = carruselTrack?.querySelectorAll('.carruselSlide')
    const thumbs = thumbsContainer?.querySelectorAll('.thumb')

    if (!slides || indice < 0 || indice >= slides.length) return

    slides[imagenActual]?.classList.remove('activo')
    thumbs?.[imagenActual]?.classList.remove('activo')

    imagenActual = indice

    slides[imagenActual].classList.add('activo')
    thumbs?.[imagenActual]?.classList.add('activo')
}

// ── Render del producto

function renderizarProducto(producto) {

    // ── Título y breadcrumb
    document.title = `Balsamoa | ${producto.nombre}`
    const breadcrumbNombre = document.getElementById('js_breadcrumbNombre')
    if (breadcrumbNombre) breadcrumbNombre.textContent = producto.nombre

    // ── Badge de disponibilidad
    if (badgeEl) {
        const badge = getBadgeDisponibilidad(producto.disponibilidad)
        if (badge) {
            badgeEl.textContent = badge.texto
            badgeEl.className   = `galeriaBadge cardBadge ${badge.clase}`
            badgeEl.hidden      = false
        } else {
            badgeEl.hidden = true
        }
    }

    // ── Carrusel
    // El producto puede traer un array `imagenes` o solo `imagen` (objeto único)
    const imagenesArr = Array.isArray(producto.imagenes) && producto.imagenes.length
        ? producto.imagenes
        : [producto.imagen_principal].filter(Boolean)

    inicializarCarrusel(imagenesArr)

    // ── Texto
    if (nombreEl) nombreEl.textContent = producto.nombre
    if (precioEl) precioEl.textContent  = `$${Number(producto.precio).toLocaleString('es-AR')}`
    if (descripcionEl) descripcionEl.textContent =
        producto.descripcion || 'Este producto no tiene descripción detallada por el momento.'

   // ── Colores
    const coloresContenedor = document.getElementById('js_colores')
    const coloresGrid = document.getElementById('js_coloresGrid')
    
    if (coloresContenedor && coloresGrid) {
        if (Array.isArray(producto.colores_hex) && producto.colores_hex.length) {
            // Ahora sí los inyectamos adentro de la grilla que los pone uno al lado del otro
            coloresGrid.innerHTML = producto.colores_hex.map(hex =>
                `<span class="colorCirculo colorCirculo--lg" style="background-color:${hex}" title="${hex}"></span>`
            ).join('')
            coloresContenedor.hidden = false
        } else {
            coloresContenedor.hidden = true
        }
    }

    // ── Talles (Regla 2: usar tieneStock)
    renderizarTalles(producto)

    // ── Botones de acción
    if (btnWsp) {
        btnWsp.addEventListener('click', () => {
            const talle  = talleActual ? `Talle: ${talleActual}` : 'sin talle seleccionado'
            const mensaje = encodeURIComponent(
                `Hola Balsamoa! 👋 Me interesa el producto *${producto.nombre}* (${talle}). ¿Está disponible?`
            )
            window.open(`https://wa.me/${WS_NUMERO}?text=${mensaje}`, '_blank')
        })
    }

    if (btnComprar) {
        btnComprar.addEventListener('click', () => {
            const stockArr = Array.isArray(producto.stock_por_talle) ? producto.stock_por_talle : []
            const necesitaTalle = stockArr.length > 0

            if (necesitaTalle && !talleActual) {
                shakeElemento(tallesEl)
                mostrarToast('Seleccioná un talle antes de continuar')
                return
            }
            // TODO: integrar pasarela de pago
            mostrarToast('¡Función de compra próximamente!')
        })
    }

    // ── Mostrar layout
    if (skeleton) skeleton.style.display = 'none'
    if (contenidoDetalle) contenidoDetalle.style.display = 'grid'
}

/**
 * Dibuja los botones de talle respetando la Regla 2:
 * deshabilita y aplica clase `agotado` cuando tieneStock === false.
 */
function renderizarTalles(producto) {
    if (!tallesEl) return
    tallesEl.innerHTML = ''

    const stockArr = Array.isArray(producto.stock_por_talle) ? producto.stock_por_talle : []

    if (stockArr.length === 0) {
        tallesEl.innerHTML = '<span class="talleUnico">Talle único</span>'
        return
    }

    stockArr.forEach(({ talle, tieneStock }) => {
        const btn = document.createElement('button')
        btn.type      = 'button'
        btn.className = `talleBtn${tieneStock ? '' : ' agotado'}`
        btn.textContent = talle
        btn.disabled    = !tieneStock
        btn.setAttribute('aria-label', tieneStock ? `Talle ${talle}` : `Talle ${talle} — sin stock`)

        if (tieneStock) {
            btn.addEventListener('click', () => seleccionarTalle(btn, talle))
        }

        tallesEl.appendChild(btn)
    })
}

function seleccionarTalle(btnClickeado, talle) {
    tallesEl.querySelectorAll('.talleBtn').forEach(b => b.classList.remove('activo'))
    btnClickeado.classList.add('activo')
    talleActual = talle

    if (talleSeleccionado) {
        talleSeleccionado.textContent = talle
        talleSeleccionado.style.display = 'inline'
    }
}

// ── Render de relacionados

function renderizarRelacionados(todos, actual) {
    if (!relacionadosEl) return

    // Filtramos por la misma categoría Y excluimos el actual
    const relacionados = todos
        .filter(p => String(p.id) !== String(actual.id) && p.categoria === actual.categoria)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)

    // Si no hay otros productos, ocultamos la sección
    if (!relacionados.length) {
        const seccion = document.querySelector('.relacionadosSeccion')
        if (seccion) seccion.style.display = 'none'
        return
    }

    relacionadosEl.innerHTML = relacionados.map(producto => {
        // 1. Badge de disponibilidad
        const badge = getBadgeDisponibilidad(producto.disponibilidad)
        const badgeHTML = badge
            ? `<span class="cardBadge ${badge.clase}">${badge.texto}</span>`
            : ''

        // 2. Precio formateado sin espacios raros
        const precioFormateado = `$${Number(producto.precio).toLocaleString('es-AR')}`

        // 3. Círculos de colores (idéntico al index)
        const coloresHTML = Array.isArray(producto.colores_hex) && producto.colores_hex.length
            ? `<div class="cardColores">
                   ${producto.colores_hex.map(hex =>
                       `<span class="colorCirculo" style="background-color:${hex}" title="${hex}"></span>`
                   ).join('')}
               </div>`
            : ''

        // 4. Maquetación exacta de la tarjeta
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
    }).join('')
}

// ── Carga principal (fetch paralelo)

async function cargarProducto() {
    if (!productoId) {
        mostrarError('No se especificó un producto.')
        return
    }

    try {
        // Fetch paralelo: producto individual + catálogo completo para relacionados
        const [respProducto, respCatalogo] = await Promise.all([
            fetch(`${API_BASE}/${productoId}`),
            fetch(API_BASE),
        ])

        // El producto específico sí debe existir → 404 es error real
        if (!respProducto.ok) {
            throw new Error(
                respProducto.status === 404
                    ? 'Producto no encontrado en el catálogo'
                    : `HTTP ${respProducto.status}`
            )
        }

        const producto = await respProducto.json()

        // El catálogo para relacionados puede fallar sin romper la vista
        let catalogo = []
        if (respCatalogo.ok) {
            const data = await respCatalogo.json()
            catalogo = Array.isArray(data) ? data : []
        }

        renderizarProducto(producto)
        renderizarRelacionados(catalogo, producto)

    } catch (error) {
        console.error('[Balsamoa] Error cargando producto:', error)
        mostrarError('No pudimos cargar el producto. Intentá de nuevo más tarde.')
        if (skeleton) skeleton.style.display = 'none'
    }
}

cargarProducto()