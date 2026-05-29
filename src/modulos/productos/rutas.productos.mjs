import { Router } from "express"
import * as controlador from './controlador.productos.mjs'

const rutasProductos = new Router()

// ---> Rutas de Admin (CRUD)
// LECTURAS (GET)
rutasProductos.get('/api/v1/admin/productos', controlador.obtenerProductos)
rutasProductos.get('/api/v1/admin/productos/:id', controlador.obtenerProductoPorId)

// ALTA (POST)
rutasProductos.post('/api/v1/admin/productos', controlador.crearProducto)

// MODIFICACIÓN (PUT / PATCH)
rutasProductos.put('/api/v1/admin/productos/:id', controlador.actualizarProducto)

// BAJA (DELETE)
rutasProductos.delete('/api/v1/admin/productos/:id', controlador.eliminarProducto)

// ---> Rutas Publicas (Solo lectura para la tienda)
rutasProductos.get('/api/v1/tienda/productos', controlador.obtenerProductosPublicos)
rutasProductos.get('/api/v1/tienda/productos/:id', controlador.obtenerProductoPublicoPorId)

export default rutasProductos
