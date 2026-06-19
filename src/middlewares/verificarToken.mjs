import jwt from 'jsonwebtoken'
import { buscarUsuarioPorId } from '../modulos/autenticacion/modelo.autenticacion.mjs'

export async function verificarToken(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ mensaje: 'No autorizado' })
    }

    try {
        const datosToken = jwt.verify(token, process.env.FIRMA_JWT)

        const usuario = await buscarUsuarioPorId(datosToken.id)

        if (!usuario) {
            return res.status(401).json({ mensaje: 'No autorizado' })
        }
        
        if (usuario.sesion_id !== datosToken.sesion_id) {
           return res.status(401).json({ mensaje: 'Sesión inválida' })
        }

        req.usuario = datosToken
        next()

        
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o vencido' })
    }
}