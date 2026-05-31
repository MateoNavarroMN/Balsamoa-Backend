import pool from "../../config/conexion.bd.mjs"

// Lectura
export async function obtenerProductos() {
    try {
        // Consultamos directamente la vista que armamos
        const resultado = await pool.query(`
            SELECT * FROM vista_catalogo_productos 
            ORDER BY id ASC
        `)
        return resultado.rows
    } catch (error) {
        console.error('Error al obtener productos:', error)
        return { error: error.message }
    }
}

export async function obtenerProductoPorId(id) {
    try {
        // Aprovechamos la misma vista filtrando por ID
        const resultado = await pool.query(`
            SELECT * FROM vista_catalogo_productos 
            WHERE id = $1
        `, [id])

        // Retornamos el objeto directamente en lugar de un array
        return resultado.rows[0] || []
    } catch (error) {
        console.error('Error al obtener producto por ID:', error)
        return { error: error.message }
    }
}

// ALTA (Agregado lógico o físico)
// export async function crearProducto(id, datos) {}

export async function activarProducto(id) {
    try {
        const resultado = await pool.query(
            `UPDATE productos SET activo = true WHERE id = $1 RETURNING *`,
            [id]
        )
        return resultado.rows
    } catch (error) {
        console.error(`Error al activar el producto ${id}:`, error)
        return { error: error.message }
    }
}

// Modificacion
// Usa una conexión dedicada (client) para que BEGIN/ROLLBACK/COMMIT
// operen sobre la misma conexión y el rollback funcione correctamente.
export async function actualizarProducto(id, datos) {
    const {
        nombre, descripcion, precio, categoria_id,
        destacado, activo,
        imagenes,  // [{ url, orden }]
        variantes  // [{ talle_id, color_id, stock, activo }]
    } = datos

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        // Actualizar tabla productos
        // COALESCE preserva el valor actual cuando el campo viene undefined/null
        const resultadoProducto = await client.query(
            `UPDATE productos
             SET nombre       = COALESCE($1, nombre),
                 descripcion  = COALESCE($2, descripcion),
                 precio       = COALESCE($3, precio),
                 categoria_id = COALESCE($4, categoria_id),
                 destacado    = COALESCE($5, destacado),
                 activo       = COALESCE($6, activo)
             WHERE id = $7
             RETURNING *`,
            [
                nombre ?? null,
                descripcion ?? null,
                precio ?? null,
                categoria_id ?? null,
                destacado ?? null,
                activo ?? null,
                id
            ]
        )

        if (resultadoProducto.rowCount === 0) {
            await client.query('ROLLBACK')
            return []
        }

        // Reemplazar imágenes si se enviaron
        // Estrategia: delete + insert → maneja altas, bajas y reordenamiento
        if (Array.isArray(imagenes)) {
            await client.query(
                `DELETE FROM producto_imagenes WHERE producto_id = $1`,
                [id]
            )
            for (const img of imagenes) {
                await client.query(
                    `INSERT INTO producto_imagenes (producto_id, url, orden)
                     VALUES ($1, $2, $3)`,
                    [id, img.url, img.orden ?? 1]
                )
            }
        }

        // Sincronizar variantes si se enviaron
        // Estrategia: upsert → respeta la restricción UNIQUE (producto, talle, color)
        if (Array.isArray(variantes)) {
            for (const v of variantes) {
                await client.query(
                    `INSERT INTO variantes (producto_id, talle_id, color_id, stock, activo)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (producto_id, talle_id, color_id)
                     DO UPDATE SET
                         stock  = EXCLUDED.stock,
                         activo = EXCLUDED.activo`,
                    [id, v.talle_id, v.color_id, v.stock ?? 0, v.activo ?? true]
                )
            }
        }

        await client.query('COMMIT')
        return resultadoProducto.rows[0]

    } catch (error) {
        await client.query('ROLLBACK')
        console.error(`Error en transacción al actualizar producto ${id}:`, error)
        return { error: error.message, code: error.code }
    } finally {
        client.release()
    }
}

// BAJA (Eliminar lógica o física)
export async function desactivarProducto(id) {
    try {
        const resultado = await pool.query(
            `UPDATE productos SET activo = false WHERE id = $1 RETURNING *`,
            [id]
        )
        return resultado.rows
    } catch (error) {
        console.error(`Error al desactivar el producto ${id}:`, error)
        return { error: error.message }
    }
}

export async function eliminarProducto(id) {
    try {
        const resultado = await pool.query(
            `DELETE FROM productos WHERE id = $1 RETURNING *`,
            [id]
        )
        return resultado.rows
    } catch (error) {
        console.error(`Error al eliminar el producto ${id}:`, error)
        return { error: error.message, code: error.code }
    }
}


