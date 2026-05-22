import { renderizarProdsDestacados } from "./funciones.js"

const contenedorProdsDest = document.getElementById('id_contenedorProductosDestacados')

async function cargarProductosDestacados() {
    try {
        const respuesta = await fetch('https://69d676ce1c120e733cce4248.mockapi.io/productos-balsamoa')
        const productos = await respuesta.json()
        renderizarProdsDestacados(productos, [1, 2, 3], contenedorProdsDest)
    } catch (error) {
        console.error('Error:', error)
        contenedorProdsDest.innerHTML = '<p style="padding:20px;color:#6B6B6B">Error al cargar los productos. Intente más tarde.</p>'
    }
}

cargarProductosDestacados()