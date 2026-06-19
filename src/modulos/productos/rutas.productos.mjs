import { Router } from "express"
import * as controlador from './controlador.productos.mjs'
import { verificarToken } from '../../middlewares/verificarToken.mjs'

const rutasProductos = new Router()

// Subir una imagen al disco y devolver su ruta pública
rutasProductos.post(
    '/api/v1/admin/imagenes/subir',
    verificarToken,
    controlador.subirImagen
)

// Eliminar una imagen del disco y de la BD por su ID
rutasProductos.delete(
    '/api/v1/admin/imagenes/:id',
    verificarToken,
    controlador.eliminarImagen
)

// ---> Rutas de Admin (CRUD)

// LECTURAS (GET)
rutasProductos.get(
    '/api/v1/admin/productos',
    verificarToken,
    controlador.obtenerProductos
)

rutasProductos.get(
    '/api/v1/admin/productos/:id',
    verificarToken,
    controlador.obtenerProductoPorId
)

// ALTA (POST)
rutasProductos.post(
    '/api/v1/admin/productos',
    verificarToken,
    controlador.crearProducto
)

// MODIFICACIÓN (PUT)
rutasProductos.put(
    '/api/v1/admin/productos/:id',
    verificarToken,
    controlador.actualizarProducto
)

// BAJA Y ALTA LÓGICA
rutasProductos.patch(
    '/api/v1/admin/productos/:id/desactivar',
    verificarToken,
    controlador.desactivarProducto
)

rutasProductos.patch(
    '/api/v1/admin/productos/:id/activar',
    verificarToken,
    controlador.activarProducto
)

// BAJA (DELETE)
rutasProductos.delete(
    '/api/v1/admin/productos/:id',
    verificarToken,
    controlador.eliminarProducto
)

// ---> Rutas Públicas (Solo lectura para la tienda)

rutasProductos.get(
    '/api/v1/tienda/productos',
    controlador.obtenerProductosPublicos
)

rutasProductos.get(
    '/api/v1/tienda/productos/:id',
    controlador.obtenerProductoPublicoPorId
)

export default rutasProductos