import { pool } from "../../config/bd.mjs"

export async function obtenerProductosApi(){
    try {
        const resultado = await pool.query('SELECT * FROM productos')
        return resultado.rows
    } catch (error) {
        return { mensaje: error}
    }
}