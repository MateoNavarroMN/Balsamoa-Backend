import { renderizarProductos, filtrarProductos, ordenarProductos } from "./funciones.js"
import { inicializarModal } from "./modal.js"

const contenedorProds = document.getElementById('id_contenedorProductos')
const btnMostrarMas = document.getElementById('id_btnMostarMas')
const formFiltros = document.getElementById('id_formFiltros')
const btnsOrden = document.querySelectorAll('.opcionOrden')

const productosIniciales = 5
const productosPorCarga = 3

let productos = []
let productosFiltrados = []
let productosVisibles = 0

async function iniciarPagina() {
    try {
        const respuesta = await fetch('./recursos/datos/bdProductos.json')
        productos = await respuesta.json()

        productosFiltrados = [...productos]

        actualizarVistaProductos()
        inicializarModal(productos, contenedorProds)

    } catch (error) {
        console.log('Error:', error)
        contenedorProds.innerHTML = '<p>Error al cargar los productos. Intente más tarde.</p>'
        btnMostrarMas.style.display = 'none';
    }
}

iniciarPagina()

function actualizarVistaProductos() {
    productosVisibles = productosIniciales

    if (productosVisibles > productosFiltrados.length) {
        productosVisibles = productosFiltrados.length
    }

    const productosAMostrar = productosFiltrados.slice(0, productosVisibles)

    renderizarProductos(productosAMostrar, contenedorProds, true)

    if (productosVisibles >= productosFiltrados.length) {
        btnMostrarMas.style.display = 'none'
    } else {
        btnMostrarMas.style.display = 'block'
    }
}

function cargarMasProductos() {
    const indiceInicio = productosVisibles
    let indiceFin = productosVisibles + productosPorCarga

    if (indiceFin > productosFiltrados.length) {
        indiceFin = productosFiltrados.length
    }

    const productosNuevos = productosFiltrados.slice(indiceInicio, indiceFin)

    renderizarProductos(productosNuevos, contenedorProds, false)

    productosVisibles = indiceFin

    if (productosVisibles >= productosFiltrados.length) {
        btnMostrarMas.style.display = 'none'
    }
}

function aplicarFiltros() {
    productosFiltrados = filtrarProductos(productos)
    actualizarVistaProductos()
}

function aplicarOrdenamiento(orden) {
    productosFiltrados = ordenarProductos(productosFiltrados, orden)
    actualizarVistaProductos()
}

function limpiarFiltros() {
    productosFiltrados = [...productos]
    actualizarVistaProductos()
}

// eventos
formFiltros.addEventListener('submit', function (e) {
    e.preventDefault()
    aplicarFiltros()

    const menuFiltros = document.getElementById('id_menuFiltros')
    menuFiltros.removeAttribute('open')
})

formFiltros.addEventListener('reset', function () {
    setTimeout(() => {
        limpiarFiltros()
    }, 10)
})

btnsOrden.forEach(btn => {
    btn.addEventListener('click', function () {
        const orden = this.getAttribute('data-value')
        aplicarOrdenamiento(orden)

        const menuOrdenamientos = document.getElementById('id_menuOrdenamientos')
        menuOrdenamientos.removeAttribute('open')
    })
})

btnMostrarMas.addEventListener('click', cargarMasProductos)