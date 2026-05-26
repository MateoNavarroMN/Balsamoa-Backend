import pg from 'pg'
import dotenv from 'dotenv'

// Cargar las variables del .env
dotenv.config()
const { Pool } = pg

// Crear el "pool" de conexiones a PostgreSQL
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
})

// Probar la conexión al iniciar
pool.on('connect', () => {
    console.log('Base de datos PostgreSQL conectada con éxito')
})

pool.on('error', (err) => {
    console.error('Error en la base de datos', err)
})