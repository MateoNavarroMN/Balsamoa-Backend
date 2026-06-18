import express from 'express'
import path from 'path' // manipular y unir rutas de carpetas de forma segura
import { fileURLToPath } from 'url' // convierte una URL (file://...) a una ruta normal del sistema operativo (C:/...)
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

// Imports de Rutas de cada modulo
import rutasProductos from './modulos/productos/rutas.productos.mjs'
import rutasCategorias from './modulos/categorias/rutas.categorias.mjs'
import rutasTalles from './modulos/talles/rutas.talles.mjs'
import rutasColores from './modulos/colores/rutas.colores.mjs'
import rutasAutenticacion from './modulos/autenticacion/rutas.autenticacion.mjs'

dotenv.config()

const app = express()
const PUERTO = process.env.PUERTO || 3000

const __filename = fileURLToPath(import.meta.url) // ruta absoluta exacta de server.mjs
const __dirname = path.dirname(__filename) // ruta absoluta de la carpeta src

app.use(express.json())
app.use(cookieParser())


// Rutas de Front
// Le suma a la carpeta --> C:/.../src/
app.use('/recursos', express.static(path.join(__dirname, './public/recursos')))
app.use('/admin', express.static(path.join(__dirname, './public/admin')))
app.use('/', express.static(path.join(__dirname, './public/tienda')))

// Rutas de tu API
app.use(rutasAutenticacion)
app.use(rutasProductos)
app.use(rutasCategorias)
app.use(rutasTalles)
app.use(rutasColores)

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`)
    console.log(`Panel de Admin http://localhost:${PUERTO}/admin`)
})