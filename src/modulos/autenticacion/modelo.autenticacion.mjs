import pool from "../../config/conexion.bd.mjs"

export async function buscarUsuarioPorEmail(email) {
    try {
        const resultado = await pool.query(`
                SELECT *
                FROM usuarios
                WHERE email = $1 AND activo = true
            `,
            [email]
        )
        return resultado.rows[0] || null
    } catch (error) {
        console.log(error)
        return { error: error.message }
    }
}

export async function actualizarSesionUsuario(usuarioId, sesionId) {
    try {
        await pool.query(`
            UPDATE usuarios 
            SET sesion_id = $1 
            WHERE id = $2
            `, 
            [sesionId, usuarioId]
        )
        return true
    } catch (error) {
        console.error('Error actualizando sesión:', error)
        return { error: error.message }
    }
}