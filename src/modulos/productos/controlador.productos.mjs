import * as modelo from "./modelo.productos.mjs"

// ---> Admin (CRUD)

// Lectura 
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

// ALTA
export async function crearProducto(req, res) {
    // Acá en el futuro irá la lógica para el INSERT INTO
    res.status(201).json({ mensaje: 'Endpoint de creación (Alta) en desarrollo' });
}

// MODIFICACIÓN (Actualizar)
export async function actualizarProducto(req, res) {
    // Acá en el futuro irá la lógica para el UPDATE
    res.status(200).json({ mensaje: 'Endpoint de actualización (Modificación) en desarrollo' });
}

// BAJA (Eliminar lógica o física)
export async function eliminarProducto(req, res) {
    // Acá en el futuro irá la lógica para el UPDATE
    res.status(200).json({ mensaje: 'Endpoint de eliminación (Baja) en desarrollo' });
}

// ---> Publicos (Lectura)
export async function obtenerProductosPublicos(req, res) {
    // A futuro: traerá solo productos activos, sin info sensible de stock crítico, etc.
    res.status(200).json({ mensaje: 'Endpoint público de catálogo en desarrollo' });
}

export async function obtenerProductoPublicoPorId(req, res) {
    // A futuro: traerá el detalle de un solo producto para la vista de compra
    res.status(200).json({ mensaje: 'Endpoint público de detalle de producto en desarrollo' });
}