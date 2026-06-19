import jwt from 'jsonwebtoken'
import * as modelo from '../modulos/autenticacion/modelo.autenticacion.mjs'

export async function verificarToken(req, res, next) {
    // Buscamos el token en las cookies que envía el navegador
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Se requiere iniciar sesión.' })
    }

    try {
        // Verificamos que el token sea válido, esté bien firmado y no haya caducado
        const datosToken = jwt.verify(token, process.env.FIRMA_JWT)

        // Validación Stateful: Buscamos al usuario en la BD para ver si su sesión sigue viva
        const usuario = await modelo.buscarUsuarioPorId(datosToken.id)

        // Si el usuario no existe, o si el sesion_id de la BD no coincide con el del token 
        // (significa que alguien le cerró la sesión remotamente)
        if (!usuario || usuario.sesion_id !== datosToken.sesion_id)  {
            return res.status(401).json({ mensaje: 'Sesión inválida o revocada.' })
        }

        // Guardamos los datos del usuario en la request
        // por si algún controlador los necesita, y continua con next()
        req.usuario = datosToken
        next()

    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' })
    }
}