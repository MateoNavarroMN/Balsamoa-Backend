import express from 'express'

const app = express()

const PUERTO = 3000

app.use(express.static('public')) //muestra el front 

app.listen(PUERTO, () => {
    console.log(`servidor corriendo en http://localhost:${PUERTO}`)
})
