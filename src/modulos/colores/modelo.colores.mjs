import pool from '../../config/conexion.bd.mjs'

export async function obtenerColores() {
    try {
        const resultado = await pool.query(`SELECT * FROM Colores`)
        return resultado.rows
    } catch (error) {
        console.error('Error al obtener colores:', error)
        return { error: error.message }
    }
}