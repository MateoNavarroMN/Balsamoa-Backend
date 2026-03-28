const overlay = document.getElementById('id_modalOverlay')
const modal = document.getElementById('id_modalProducto')
const cerrarBtn = document.getElementById('id_modalCerrar')
const imagen = document.getElementById('id_modalImagen')
const nombre = document.getElementById('id_modalNombre')
const precio = document.getElementById('id_modalPrecio')
const descripcion = document.getElementById('id_modalDescripcion')
const talles = document.getElementById('id_modalTalles')

let todosLosProductos = []

function _rellenarDatos(producto) {
    imagen.src = producto.imagen.src
    imagen.alt = producto.imagen.alt
    nombre.textContent = producto.nombre
    precio.textContent = `$${producto.precio}`

    descripcion.textContent = producto.descripcion || 'Este producto no tiene una descripción detallada por el momento.'
    
    talles.innerHTML = ''
    if (producto.talles && producto.talles.length > 0) {
        producto.talles.forEach(talle => {
            const talleSpan = document.createElement('span')
            talleSpan.textContent = talle
            talles.appendChild(talleSpan)
        })
    } else {
        talles.innerHTML = '<span>Talle único o no especificado</span>'
    }
}

function abrirModal(productoId) {
    const productoEncontrado = todosLosProductos.find(prod => prod.id == productoId);

    if (productoEncontrado) {
        _rellenarDatos(productoEncontrado)
        overlay.classList.add('active')
        modal.classList.add('active')
    } else {
        console.error('No se encontró el producto con ID:', productoId)
    }
}

function cerrarModal() {
    overlay.classList.remove('active')
    modal.classList.remove('active')
}

function inicializarModal(productosArray, contenedorProductos) {
    todosLosProductos = productosArray

    cerrarBtn.addEventListener('click', cerrarModal)
    overlay.addEventListener('click', cerrarModal)

    contenedorProductos.addEventListener('click', function(e) {
        e.preventDefault(); 

        const articleClickeado = e.target.closest('article[data-id]');
        
        if (articleClickeado) {
            const productoId = articleClickeado.dataset.id;
            if (productoId) {
                abrirModal(productoId);
            }
        }
    });
}

export { inicializarModal }