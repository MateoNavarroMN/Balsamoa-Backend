import * as modelo from './modelo.autenticacion.mjs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'

export async function login(req, res) {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' })
    }

    // Buscamos al usuario en la BD
    const usuario = await modelo.buscarUsuarioPorEmail(email)
    // Si no existe, devolvemos error genérico por seguridad
    if (!usuario || usuario.error) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' })
    }

    // Comparamos el hash con la contraseña ingresada
    const esValida = await bcrypt.compare(password, usuario.password_hash)
    if (!esValida) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' })
    }

    // Generamos el sesion_id y lo guardamos en la BD
    const sesionId = nanoid()
    const guardado = await modelo.actualizarSesionUsuario(usuario.id, sesionId)
    if (guardado.error) {
        return res.status(500).json({ mensaje: 'Error interno del servidor' })
    }

    // Firmamos el JWT (incluyendo el ID de usuario, rol y el sesion_id)
    const token = jwt.sign(
        {
            id: usuario.id,
            rol: usuario.rol_id,
            sesion_id: sesionId
        },
        process.env.FIRMA_JWT,
        { expiresIn: '8h' }
    )

    // Devolvemos el JWT dentro de una cookie HttpOnly
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // En Vercel exigirá HTTPS
        sameSite: 'strict', // Evita ataques CSRF
        maxAge: 8 * 60 * 60 * 1000 // 8 horas de duración
    })

    // Retornamos un 200 sin el token en el body
    res.status(200).json({
        mensaje: 'Login exitoso',
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
    })
}

export async function logout(req, res) {
    const token = req.cookies.token
    if (token) {
        try {
            const decodificado = jwt.verify(token, process.env.FIRMA_JWT)
            await modelo.actualizarSesionUsuario(decodificado.id, null)
        } catch (error) {
            // Si el token ya expiró o es inválido, ignoramos el error de BD,
            // nuestro objetivo principal es destruir la cookie.
        }
    }

    // Limpiamos la cookie en el navegador del cliente
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    })

    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' })
}