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
// Configuramos Express para que oculte y autocompleta las extensiones .html
const opcionesFront = { extensions: ['html'] }

// Le suma a la carpeta --> C:/.../src/
app.use('/recursos', express.static(path.join(__dirname, './public/recursos')))
app.use('/admin', express.static(path.join(__dirname, './public/admin'), opcionesFront))
app.use('/login', express.static(path.join(__dirname, './public/login'), opcionesFront))
app.use('/', express.static(path.join(__dirname, './public/tienda'), opcionesFront))

// Rutas de tu API
app.use(rutasAutenticacion)
app.use(rutasProductos)
app.use(rutasCategorias)
app.use(rutasTalles)
app.use(rutasColores)

// Atrapar cualquier ruta de la API que no exista
// Al poner solo el prefijo, atrapa todo lo sobrante que empiece con /api/v1
app.use('/api/v1', (req, res) => {
    res.status(404).json({ mensaje: 'Endpoint no encontrado' });
})

// Atrapar cualquier otra ruta visual que no exista (Error 404 Front-End)
app.use((req, res) => {
    res.redirect('/');
})

// Condicionamos el listen para que no bloquee a Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PUERTO, () => {
        console.log(`.................................................`)
        console.log(`Tienda: http://localhost:${PUERTO}`)
        console.log(`Panel de Admin: http://localhost:${PUERTO}/admin`)
        console.log(`.................................................`)
    })
}

// Exportamos la app para que Vercel la levante como función Serverless
export default app