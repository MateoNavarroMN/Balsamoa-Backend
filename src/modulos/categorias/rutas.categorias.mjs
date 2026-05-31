import { Router } from "express"
import * as controlador from './controlador.categorias.mjs'

const rutasCategorias = new Router()

rutasCategorias.get('/api/v1/admin/categorias', controlador.obtenerCategorias)

export default rutasCategorias