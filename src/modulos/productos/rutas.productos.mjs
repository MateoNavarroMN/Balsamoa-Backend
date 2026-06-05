import { Router } from "express"
import * as controlador from './controlador.productos.mjs'

const rutasProductos = new Router()

// Subir una imagen al disco y devolver su ruta pública
rutasProductos.post('/api/v1/admin/imagenes/subir', controlador.subirImagen)
// Eliminar una imagen del disco y de la BD por su ID
rutasProductos.delete('/api/v1/admin/imagenes/:id', controlador.eliminarImagen)

// ---> Rutas de Admin (CRUD)
// LECTURAS (GET)
rutasProductos.get('/api/v1/admin/productos', controlador.obtenerProductos)
rutasProductos.get('/api/v1/admin/productos/:id', controlador.obtenerProductoPorId)

// ALTA (POST)
rutasProductos.post('/api/v1/admin/productos', controlador.crearProducto)

// MODIFICACIÓN (PUT)
rutasProductos.put('/api/v1/admin/productos/:id', controlador.actualizarProducto)

// BAJA Y ALTA LOGICA
rutasProductos.patch('/api/v1/admin/productos/:id/desactivar', controlador.desactivarProducto)
rutasProductos.patch('/api/v1/admin/productos/:id/activar', controlador.activarProducto)

// BAJA (DELETE)
rutasProductos.delete('/api/v1/admin/productos/:id', controlador.eliminarProducto)

// ---> Rutas Publicas (Solo lectura para la tienda)
rutasProductos.get('/api/v1/tienda/productos', controlador.obtenerProductosPublicos)
rutasProductos.get('/api/v1/tienda/productos/:id', controlador.obtenerProductoPublicoPorId)

export default rutasProductos
