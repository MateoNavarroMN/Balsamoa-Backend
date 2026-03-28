import { renderizarProdsDestacados } from "./funciones.js"
import { inicializarModal } from "./modal.js"

const contenedorProdsDest = document.getElementById('id_contenedorProductosDestacados')

async function cargarProductosDestacados() {
    try {
        const respuesta = await fetch('./recursos/datos/bdProductos.json')
        const productos = await respuesta.json()

        renderizarProdsDestacados(productos, [1, 2, 3], contenedorProdsDest)
        inicializarModal(productos, contenedorProdsDest)

    } catch (error) {
        console.log('Error:', error)
        contenedorProdsDest.innerHTML = '<p>Error al cargar los productos. Intente más tarde.</p>'
    }
}

cargarProductosDestacados()