import { Router } from "express"
import * as controlador from './controlador.autenticacion.mjs'

const rutasAutenticacion = new Router()

rutasAutenticacion.post('/api/v1/autenticacion/login', controlador.login)
rutasAutenticacion.post('/api/v1/autenticacion/logout', controlador.logout)

export default rutasAutenticacion