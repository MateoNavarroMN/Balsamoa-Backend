import { Router } from "express"
import * as controlador from './controlador.talles.mjs'

const rutasTalles = new Router()

rutasTalles.get('/api/v1/admin/talles', controlador.obtenerTalles)

export default rutasTalles