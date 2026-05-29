import { Router } from "express"
import * as controlador from './controlador.productos.mjs'

const rutasProductos = new Router()

rutasProductos.get('/api/v1/productos', controlador.obtenerProductos)

rutasProductos.get('/api/v1/productos/:id', controlador.obtenerProductoPorId)

export default rutasProductos
