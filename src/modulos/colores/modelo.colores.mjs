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

export async function crearColor(nombre, hex) {
    try {
        // 1. Verificamos si ya existe el nombre (ignorando mayúsculas) o el HEX
        const busqueda = await pool.query(
            `SELECT * FROM Colores WHERE LOWER(nombre) = LOWER($1) OR hex = $2`,
            [nombre, hex]
        )
        
        if (busqueda.rows.length > 0) {
            // Si ya existía, lo devolvemos avisando que es recuperado
            return { existente: true, color: busqueda.rows[0] }
        }

        // 2. Si no existía, lo insertamos
        const resultado = await pool.query(
            `INSERT INTO Colores (nombre, hex) VALUES ($1, $2) RETURNING *`,
            [nombre, hex]
        )
        return { existente: false, color: resultado.rows[0] }

    } catch (error) {
        console.error('Error al crear o buscar color:', error)
        return { error: error.message }
    }
}