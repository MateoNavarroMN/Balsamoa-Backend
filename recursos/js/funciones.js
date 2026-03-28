// index
function renderizarProdsDestacados(productos, prodsDest, contenedor) {
    let contenidoProductos = ''

    productos.forEach((producto) => {
        prodsDest.forEach((destacado) => {
            if (producto.id == destacado) {
                const plantillaProductos =
                    `
                        <article data-id="${producto.id}">
                            <a href="">
                                <img src="${producto.imagen.src}" alt="${producto.imagen.alt}">
                                <h3>${producto.nombre}</h3>
                                <p>$${producto.precio}</p>
                            </a>
                        </article>
                    `
                contenidoProductos += plantillaProductos
            }
        })
    })
    contenedor.innerHTML = contenidoProductos
}

// productos
function renderizarProductos(productos, contenedor, limpiarContenedor = true) {
    let contenidoProductos = ''

    productos.forEach((producto) => {
        const plantillaProductos =
            `
                <article data-id="${producto.id}">
                    <a href="">
                        <img src="${producto.imagen.src}" alt="${producto.imagen.alt}">
                        <h3>${producto.nombre}</h3>
                        <p>$${producto.precio}</p>
                    </a>
                </article>
            `
        contenidoProductos += plantillaProductos
    })

    if (limpiarContenedor) {
        contenedor.innerHTML = contenidoProductos
    }
    else {
        contenedor.insertAdjacentHTML('beforeend', contenidoProductos)
    }
}

function filtrarProductos(productos) {
    const tallesSelect = []
    const chekboxsTalles = document.querySelectorAll('input[name="talle"]:checked')
    chekboxsTalles.forEach((chTalle) => {
        tallesSelect.push(chTalle.value)
    })

    const precioDesde = parseFloat(document.querySelector('input[name="precio-desde"]').value)
    const precioHasta = parseFloat(document.querySelector('input[name="precio-hasta"]').value)

    return productos.filter((producto) => {
        let cumpleTalle = true
        if (tallesSelect.length > 0) {
            cumpleTalle = tallesSelect.some((talle) => {
                return producto.talles.includes(talle)
            })
        }

        let cumplePrecio = true
        if (!isNaN(precioDesde) && producto.precio < precioDesde) {
            cumplePrecio = false
        }

        if (!isNaN(precioHasta) && producto.precio > precioHasta) {
            cumplePrecio = false
        }

        return cumpleTalle && cumplePrecio
    })
}

function ordenarProductos(productos, orden) {
    const productosOrdenados = [...productos]

    switch (orden) {
        case 'precioAsc':
            productosOrdenados.sort((prodA, prodB) => prodA.precio - prodB.precio)
            break    
        case 'precioDesc':
            productosOrdenados.sort((prodA, prodB) => prodB.precio - prodA.precio)
            break
        case 'masNuevo':
            productosOrdenados.sort((prodA, prodB) => prodB.id - prodA.id)
            break
        case 'masAntiguo':
            productosOrdenados.sort((prodA, prodB) => prodA.id - prodB.id)
            break
    }

    return productosOrdenados
}

// index
export { renderizarProdsDestacados }
// productos
export { renderizarProductos, filtrarProductos, ordenarProductos }


