import { Router } from "express"
import * as controlador from './controlador.colores.mjs'

const rutasColores = new Router()

rutasColores.get('/api/v1/admin/colores', controlador.obtenerColores)
rutasColores.post('/api/v1/admin/colores', controlador.crearColor)

export default rutasColores