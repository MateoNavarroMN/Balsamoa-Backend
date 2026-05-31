import * as modelo from './modelo.talles.mjs'

export async function obtenerTalles(req, res){
    const talles = await modelo.obtenerTalles()

    if(talles.length === 0){
        return res.status(404).json({ mensaje: 'Registros no encontrados'})
    }

    res.json(talles)
}