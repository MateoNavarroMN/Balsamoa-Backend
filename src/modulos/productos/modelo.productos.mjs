import pool from "../../config/conexion.bd.mjs"

export async function obtenerProductos() {
    try {
        // Consultamos directamente la vista que armamos
        const resultado = await pool.query(`
            SELECT * FROM vista_catalogo_productos 
            ORDER BY id ASC
        `);
        return resultado.rows
    } catch (error) {
        console.error('Error al obtener productos:', error)
        return { mensaje: error.message }
    }
}

export async function obtenerProductoPorId(id) {
    try {
        // Aprovechamos la misma vista filtrando por ID
        const resultado = await pool.query(`
            SELECT * FROM vista_catalogo_productos 
            WHERE id = $1
        `, [id])
        
        // Retornamos el objeto directamente en lugar de un array
        return resultado.rows[0] || []
    } catch (error) {
        console.error('Error al obtener producto por ID:', error)
        return { mensaje: error.message }
    }
}