import express from 'express'
import path from 'path' // manipular y unir rutas de carpetas de forma segura
import { fileURLToPath } from 'url' // convierte una URL (file://...) a una ruta normal del sistema operativo (C:/...)

const app = express()
const PUERTO = 3000

const __filename = fileURLToPath(import.meta.url) // ruta absoluta exacta de server.mjs
const __dirname = path.dirname(__filename) // ruta absoluta de la carpeta src

app.use(express.static(path.join(__dirname, 'public'))) // Le suma a la carpeta src 'public' --> C:/.../src/public

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`)
})