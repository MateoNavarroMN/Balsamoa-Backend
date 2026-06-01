import pool from '../../config/conexion.bd.mjs'

export async function obtenerTalles() {
    try {
        const resultado = await pool.query(`SELECT * FROM Talles`)
        return resultado.rows
    } catch (error) {
        console.error('Error al obtener talles:', error)
        return { error: error.message }
    }
}