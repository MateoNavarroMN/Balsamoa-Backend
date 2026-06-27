import fs from 'fs'
import pool from '../src/config/conexion.bd.mjs' 

async function recrearBaseDeDatos() {
    try {
        console.log("Leyendo archivo SQL...")
        // Lee el archivo .sql de forma síncrona
        const sqlQuery = fs.readFileSync('./inicializar/balsamoa.sql', 'utf8')

        console.log("Ejecutando consultas en la base de datos...")
        await pool.query(sqlQuery)

        console.log("¡Base de datos recreada con éxito!")
        process.exit(0) // Cierra el script correctamente
    } catch (error) {
        console.error("Error al recrear la base de datos:", error)
        process.exit(1)
    }
}

recrearBaseDeDatos()