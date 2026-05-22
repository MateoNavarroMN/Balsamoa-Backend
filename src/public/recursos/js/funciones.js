function renderizarProdsDestacados(productos, prodsDest, contenedor) {
    let html = ''

    productos.forEach((producto) => {
        prodsDest.forEach((destacado) => {
            if (producto.id == destacado) {
                html += `
                    <article data-id="${producto.id}">
                        <a href="./producto.html?id=${producto.id}">
                            <div class="imgWrap">
                                <img src="${producto.imagen.src}" alt="${producto.imagen.alt}" loading="lazy">
                            </div>
                            <div class="cardInfo">
                                <h3>${producto.nombre}</h3>
                                <p>$${Number(producto.precio).toLocaleString('es-AR')}</p>
                            </div>
                        </a>
                    </article>
                `
            }
        })
    })

    contenedor.innerHTML = html
}

function renderizarProductos(productos, contenedor, limpiarContenedor = true) {
    let html = ''

    productos.forEach((producto) => {
        html += `
            <article data-id="${producto.id}">
                <a href="./producto.html?id=${producto.id}">
                    <div class="imgWrap">
                        <img src="${producto.imagen.src}" alt="${producto.imagen.alt}" loading="lazy">
                    </div>
                    <div class="cardInfo">
                        <h3>${producto.nombre}</h3>
                        <p>$${Number(producto.precio).toLocaleString('es-AR')}</p>
                    </div>
                </a>
            </article>
        `
    })

    if (limpiarContenedor) {
        contenedor.innerHTML = html
    } else {
        contenedor.insertAdjacentHTML('beforeend', html)
    }
}

function filtrarProductos(productos) {
    const tallesSelect = []
    document.querySelectorAll('input[name="talle"]:checked')
        .forEach(cb => tallesSelect.push(cb.value))

    const precioDesde = parseFloat(document.querySelector('input[name="precio-desde"]').value)
    const precioHasta = parseFloat(document.querySelector('input[name="precio-hasta"]').value)

    return productos.filter((producto) => {
        let cumpleTalle = true
        if (tallesSelect.length > 0) {
            cumpleTalle = tallesSelect.some(t => producto.talles.includes(t))
        }

        let cumplePrecio = true
        if (!isNaN(precioDesde) && producto.precio < precioDesde) cumplePrecio = false
        if (!isNaN(precioHasta) && producto.precio > precioHasta) cumplePrecio = false

        return cumpleTalle && cumplePrecio
    })
}

function ordenarProductos(productos, orden) {
    const copia = [...productos]

    switch (orden) {
        case 'precioAsc': copia.sort((a, b) => a.precio - b.precio); break
        case 'precioDesc': copia.sort((a, b) => b.precio - a.precio); break
        case 'masNuevo': copia.sort((a, b) => b.id - a.id); break
        case 'masAntiguo': copia.sort((a, b) => a.id - b.id); break
    }

    return copia
}

export { renderizarProdsDestacados }
export { renderizarProductos, filtrarProductos, ordenarProductos }