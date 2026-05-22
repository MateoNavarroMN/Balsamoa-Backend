import { obtenerProductosApi } from "./modelo.productos.mjs"

export async function obtenerProductos(req, res){
    const productos = await obtenerProductosApi()
    res.json(productos)
}