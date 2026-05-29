import * as modelo from "./modelo.productos.mjs"

export async function obtenerProductos(req, res){
    const productos = await modelo.obtenerProductos()

    if(productos.length === 0){
        return res.status(404).json({ mensaje: 'Registros no encontrados'})
    }

    res.json(productos)
}

export async function obtenerProductoPorId(req, res){
    const id = Number(req.params.id)
    const productos = await modelo.obtenerProductoPorId(id)

    if(productos.length === 0){
        return res.status(400).json({ mensaje: 'Registro no encontrado'})
    }

    res.json(productos)
}