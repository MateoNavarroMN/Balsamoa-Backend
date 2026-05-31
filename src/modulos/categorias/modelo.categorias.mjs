import pool from '../../config/conexion.bd.mjs'

export async function obtenerCategorias() {
    try {
        const resultado = await pool.query(`SELECT * FROM Categorias`)
        return resultado.rows
    } catch (error) {
        console.error('Error al obtener categorias:', error)
        return { error: error.message }
    }
}