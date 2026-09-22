import * as modelo from './modelo.colores.mjs'

export async function obtenerColores(req, res){
    const colores = await modelo.obtenerColores()

    if(colores.length === 0){
        return res.status(404).json({ mensaje: 'Registros no encontrados'})
    }

    res.json(colores)
}

export async function crearColor(req, res) {
    const { nombre, hex } = req.body

    if (!nombre || !hex) {
        return res.status(400).json({ mensaje: 'El nombre y el color (hex) son obligatorios' })
    }

    const resultado = await modelo.crearColor(nombre, hex)

    if (resultado.error) {
        return res.status(500).json({ mensaje: 'Error al procesar el color en la base de datos' })
    }

    // Enviamos el color al frontend
    const status = resultado.existente ? 200 : 201
    res.status(status).json(resultado.color)
}