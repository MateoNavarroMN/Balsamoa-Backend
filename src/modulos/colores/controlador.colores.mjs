import * as modelo from './modelo.colores.mjs'

export async function obtenerColores(req, res){
    const talles = await modelo.obtenerColores()

    if(talles.length === 0){
        return res.status(404).json({ mensaje: 'Registros no encontrados'})
    }

    res.json(talles)
}