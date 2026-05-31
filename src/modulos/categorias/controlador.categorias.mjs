import * as modelo from './modelo.categorias.mjs'

export async function obtenerCategorias(req, res){
    const categorias = await modelo.obtenerCategorias()

    if(categorias.length === 0){
        return res.status(404).json({ mensaje: 'Registros no encontrados'})
    }

    res.json(categorias)
}