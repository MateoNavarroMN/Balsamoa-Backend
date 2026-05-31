import pg from 'pg'
import dotenv from 'dotenv'

// Inicializamos dotenv para que Node pueda leer la variable DATABASE_URL
dotenv.config()

const { Pool } = pg

// Creamos el "Pool" de conexiones usando URL de Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Como la base de datos está en la nube, exige que la conexión sea segura (SSL).
  ssl: {
    rejectUnauthorized: false
  }
})

export default pool