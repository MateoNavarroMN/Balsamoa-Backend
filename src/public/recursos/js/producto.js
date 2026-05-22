const API = 'https://69d676ce1c120e733cce4248.mockapi.io/productos-balsamoa'
const WS_NUMERO = '549111111111'

const params = new URLSearchParams(window.location.search)
const productoId = params.get('id')

const imgPrincipal = document.getElementById('js_imgPrincipal')
const imgNombre = document.getElementById('js_imgNombre')
const nombreEl = document.getElementById('js_nombre')
const precioEl = document.getElementById('js_precio')
const descripcionEl = document.getElementById('js_descripcion')
const tallesEl = document.getElementById('js_talles')
const talleSeleccionado = document.getElementById('js_talleSeleccionado')
const btnWsp = document.getElementById('js_btnWhatsapp')
const btnComprar = document.getElementById('js_btnComprar')
const skeleton = document.getElementById('js_skeleton')
const contenidoDetalle = document.getElementById('js_contenidoDetalle')
const relacionadosEl = document.getElementById('js_relacionados')
const errorEl = document.getElementById('js_error')

let talleActual = null

// ── Carga principal ──────────────────────────────────────────
async function cargarProducto() {
    if (!productoId) {
        mostrarError('No se especificó un producto.')
        return
    }

    try {
        const respuesta = await fetch(API)

        if (!respuesta.ok) throw new Error('Error al conectar con la API')

        const todos = await respuesta.json()
        const producto = todos.find(p => p.id == productoId)

        if (!producto) throw new Error('Producto no encontrado en el catálogo')

        renderizarProducto(producto)
        renderizarRelacionados(todos, producto)

        document.title = `Balsamoa — ${producto.nombre}`
        const breadcrumbNombre = document.getElementById('js_breadcrumbNombre')
        if (breadcrumbNombre) breadcrumbNombre.textContent = producto.nombre

    } catch (error) {
        console.error(error)
        mostrarError('No pudimos cargar el producto. Intentá de nuevo más tarde.')
    } finally {
        skeleton.style.display = 'none'
    }
}

function renderizarProducto(producto) {
    imgPrincipal.src = producto.imagen.src
    imgPrincipal.alt = producto.imagen.alt
    imgNombre.alt = producto.imagen.alt

    nombreEl.textContent = producto.nombre
    precioEl.textContent = `$${Number(producto.precio).toLocaleString('es-AR')}`
    descripcionEl.textContent = producto.descripcion || 'Este producto no tiene una descripción detallada por el momento.'

    tallesEl.innerHTML = ''
    if (producto.talles && producto.talles.length > 0) {
        producto.talles.forEach((talle) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'talleBtn'
            btn.textContent = talle
            btn.addEventListener('click', () => seleccionarTalle(btn, talle))
            tallesEl.appendChild(btn)
        })
    } else {
        tallesEl.innerHTML = '<span class="talleUnico">Talle único</span>'
    }

    btnWsp.addEventListener('click', () => {
        const talle = talleActual ? `Talle: ${talleActual}` : 'sin talle seleccionado'
        const mensaje = encodeURIComponent(
            `Hola Balsamoa! 👋 Me interesa el producto *${producto.nombre}* (${talle}). ¿Está disponible?`
        )
        window.open(`https://wa.me/${WS_NUMERO}?text=${mensaje}`, '_blank')
    })

    // Botón comprar (placeholder — en el futuro conectar carrito/MercadoPago)
    btnComprar.addEventListener('click', () => {
        if (!talleActual && producto.talles && producto.talles.length > 0) {
            shakeElemento(tallesEl)
            mostrarToast('Seleccioná un talle antes de continuar')
            return
        }
        // TODO: Integrar pasarela de pago
        mostrarToast('¡Función de compra próximamente!')
    })

    contenidoDetalle.style.display = 'grid'
    imgPrincipal.classList.add('visible')
}

function seleccionarTalle(btnClickeado, talle) {
    document.querySelectorAll('.talleBtn').forEach(b => b.classList.remove('activo'))
    btnClickeado.classList.add('activo')
    talleActual = talle
    talleSeleccionado.textContent = talle
    talleSeleccionado.style.display = 'inline'
}

function renderizarRelacionados(todos, actual) {
    const relacionados = todos
        .filter(p => p.id != actual.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)

    if (!relacionados.length) {
        document.querySelector('.relacionadosSeccion').style.display = 'none'
        return
    }

    relacionadosEl.innerHTML = relacionados.map(p => `
        <article class="cardRelacionado">
            <a href="./producto.html?id=${p.id}">
                <div class="cardRelImgWrap">
                    <img src="${p.imagen.src}" alt="${p.imagen.alt}" loading="lazy">
                </div>
                <div class="cardRelInfo">
                    <h3>${p.nombre}</h3>
                    <p>$${Number(p.precio).toLocaleString('es-AR')}</p>
                </div>
            </a>
        </article>
    `).join('')
}

function mostrarError(msg) {
    errorEl.style.display = 'flex'
    errorEl.querySelector('p').textContent = msg
    contenidoDetalle.style.display = 'none'
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
    setTimeout(() => toast.classList.remove('visible'), 3000)
}

function shakeElemento(el) {
    el.classList.add('shake')
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true })
}

window.addEventListener('scroll', () => {
    document.querySelector('.encabezadoPrincipal')
        ?.classList.toggle('scrolled', window.scrollY > 10)
}, { passive: true })

cargarProducto()