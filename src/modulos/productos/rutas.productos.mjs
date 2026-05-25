import { Router } from "express"
import { obtenerProductos } from './controlador.productos.mjs'

const routerProductos = new Router()

routerProductos.get('/productos', obtenerProductos)

export default routerProductos