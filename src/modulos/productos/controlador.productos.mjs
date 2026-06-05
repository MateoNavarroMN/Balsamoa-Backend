import * as modelo from "./modelo.productos.mjs"
import path from "path"
import { fileURLToPath } from "url"
import fs from 'fs'
import multer from "multer"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración privada de Multer
const CARPETA_IMAGENES = path.join(__dirname, '../../public/recursos/imagenes/productos')

if (!fs.existsSync(CARPETA_IMAGENES)) {
    fs.mkdirSync(CARPETA_IMAGENES, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, CARPETA_IMAGENES)
    },
    filename: (_req, file, cb) => {
        const nombreLimpio = file.originalname.replace(/\s+/g, '_')
        cb(null, `${Date.now()}_${nombreLimpio}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('TIPO_INVALIDO'))
        }
    }
}).single('imagen') // Preparamos la función que espera el campo 'imagen'

// ---> Admin (CRUD)

// Lectura 
export async function obtenerProductos(req, res) {
    const productos = await modelo.obtenerProductos()

    if (productos.error) {
        return res.status(500).json({ mensaje: 'Error al obtener productos', detalle: productos.error })
    }

    if (productos.length === 0) {
        return res.status(200).json([])
    }

    res.json(productos)
}

export async function obtenerProductoPorId(req, res) {
    const id = Number(req.params.id)
    const productos = await modelo.obtenerProductoPorId(id)

    if(productos.length === 0){
        return res.status(400).json({ mensaje: 'Producto no encontrado'})
    }

    res.json(productos)
}

// ALTA (Agregado lógico o físico)
export async function crearProducto(req, res) {
    const { nombre, descripcion, precio, categoria_id, destacado, imagenes, variantes } = req.body

    // ---> VALIDACIONES DE CAMPOS OBLIGATORIOS 
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ mensaje: 'El nombre es obligatorio y debe ser un texto válido' })
    }

    if (precio === undefined || isNaN(Number(precio)) || Number(precio) <= 0) {
        return res.status(400).json({ mensaje: 'El precio es obligatorio y debe ser un número positivo' })
    }

    if (!categoria_id || isNaN(Number(categoria_id))) {
        return res.status(400).json({ mensaje: 'La categoría (categoria_id) es obligatoria y debe ser un número' })
    }

    // ---> VALIDACIONES DE ESTRUCTURAS 
    if (imagenes !== undefined && !Array.isArray(imagenes)) {
        return res.status(400).json({ mensaje: 'El campo "imagenes" debe ser un arreglo' })
    }

    if (imagenes) {
        for (const img of imagenes) {
            if (!img.url || typeof img.url !== 'string') {
                return res.status(400).json({ mensaje: 'Cada imagen debe tener un campo "url" válido' })
            }
        }
    }

    if (variantes !== undefined && !Array.isArray(variantes)) {
        return res.status(400).json({ mensaje: 'El campo "variantes" debe ser un arreglo' })
    }

    if (variantes) {
        for (const v of variantes) {
            if (!v.talle_id || !v.color_id) {
                return res.status(400).json({ mensaje: 'Cada variante debe tener obligatoriamente "talle_id" y "color_id"' })
            }
            if (v.stock !== undefined && (isNaN(Number(v.stock)) || Number(v.stock) < 0)) {
                return res.status(400).json({ mensaje: 'El stock de cada variante debe ser un número no negativo' })
            }
        }
    }

    // Llamamos al modelo pasándole los datos limpios
    const resultado = await modelo.crearProducto(req.body)

    // ---> MANEJO DE ERRORES DE BASE DE DATOS
    if (resultado.error) {
        // Código 23503 en PostgreSQL indica Violación de Llave Foránea 
        // (Intentaron meter un categoria_id, talle_id o color_id que no existe en sus respectivas tablas)
        if (resultado.code === '23503') {
            return res.status(400).json({ mensaje: 'Error de consistencia: La categoría, talle o color especificado no existen' })
        }
        return res.status(500).json({ mensaje: 'Error interno en el servidor al intentar crear el producto' })
    }

    
    res.status(201).json({
        mensaje: 'Producto creado exitosamente junto con sus imágenes y variantes',
        producto: resultado
    })
}

export async function activarProducto(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID del producto debe ser un número válido' })
    }

    const resultado = await modelo.activarProducto(id)
    if (resultado.error) {
        return res.status(500).json({ mensaje: 'Error al activar el producto' })
    }

    if (resultado.length === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    res.status(200).json({
            mensaje: 'Producto agregado exitosamente (alta lógica)',
            producto: resultado
        })
}

// MODIFICACIÓN (Actualizar)
export async function actualizarProducto(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID del producto debe ser un número válido' })
    }

    const { nombre, descripcion, precio, categoria_id, destacado, imagenes, variantes } = req.body
    // Validaciones de tipos
    if (precio !== undefined && (isNaN(Number(precio)) || Number(precio) < 0)) {
        return res.status(400).json({ mensaje: 'El precio debe ser un número positivo' })
    }

    if (imagenes !== undefined && !Array.isArray(imagenes)) {
        return res.status(400).json({ mensaje: 'El campo "imagenes" debe ser un arreglo' })
    }

    // Usamos for...of para que el return corte la función principal
    if (imagenes) {
        for (const img of imagenes) {
            if (!img.url || typeof img.url !== 'string') {
                return res.status(400).json({ mensaje: 'Cada imagen debe tener un campo "url" válido' })
            }
        }
    }

    if (variantes !== undefined && !Array.isArray(variantes)) {
        return res.status(400).json({ mensaje: 'El campo "variantes" debe ser un arreglo' })
    }

    if (variantes) {
        for (const v of variantes) {
            if (!v.talle_id || !v.color_id) {
                return res.status(400).json({ mensaje: 'Cada variante debe tener "talle_id" y "color_id"' })
            }
            if (v.stock !== undefined && (isNaN(Number(v.stock)) || Number(v.stock) < 0)) {
                return res.status(400).json({ mensaje: 'El stock de cada variante debe ser un número no negativo' })
            }
        }
    }

    // Si se reemplazan imágenes, obtenemos las actuales para saber cuáles borrar del disco
    let imagenesABorrar = []
    if (Array.isArray(imagenes)) {
        const imagenesActuales = await modelo.obtenerImagenesDeProducto(id)
        if (!imagenesActuales.error) {
            const nuevasUrls = new Set(imagenes.map(img => img.url))
            // Solo borrar las que no están en la nueva lista
            imagenesABorrar = imagenesActuales.filter(img => !nuevasUrls.has(img.url))
        }
    }

    const resultado = await modelo.actualizarProducto(id, { nombre, descripcion, precio, categoria_id, destacado, imagenes, variantes })

    if (resultado.error) {
        return res.status(500).json({ mensaje: 'Error al actualizar el producto' })
    }

    if (resultado.length === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    // Borrar del disco las imágenes eliminadas (luego de confirmar que la BD se actualizó)
    for (const img of imagenesABorrar) {
        if (img.url && img.url.startsWith('/recursos/')) {
            borrarArchivo(rutaPublicaADisco(img.url))
        }
    }

    res.status(200).json({
            mensaje: 'Producto actualizado exitosamente',
            producto: resultado
        })
}

// BAJA (Eliminar lógica o física)
export async function eliminarProducto(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID del producto debe ser un número válido' })
    }

    // Obtener las imágenes ANTES de eliminar el producto
    const imagenes = await modelo.obtenerImagenesDeProducto(id)

    // Eliminar el producto de la BD
    const resultado = await modelo.eliminarProducto(id)
    if (resultado.error) {
        // Código 23503 en PostgreSQL significa "Violación de llave foránea"
        if (resultado.code === '23503') {
            return res.status(409).json({
                mensaje: 'No se puede eliminar definitivamente porque el producto ya tiene ventas registradas. Te recomendamos desactivarlo.'
            });
        }
        return res.status(500).json({ mensaje: 'Error al intentar eliminar' });
    }

    if (resultado.length === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    // Borrar los archivos del disco (solo si la BD confirmó el DELETE)
    if (!imagenes.error && Array.isArray(imagenes)) {
        for (const img of imagenes) {
            if (img.url && img.url.startsWith('/recursos/')) {
                borrarArchivo(rutaPublicaADisco(img.url))
            }
        }
    }

    res.status(200).json({
            mensaje: 'Producto eliminado definitivamente de la base de datos',
            producto: resultado
        })
}

export async function desactivarProducto(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID del producto debe ser un número válido' })
    }

    const resultado = await modelo.desactivarProducto(id)
    if (resultado.error) {
        return res.status(500).json({ mensaje: 'Error al desactivar el producto' })
    }

    if (resultado.length === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    res.status(200).json({
            mensaje: 'Producto eliminado exitosamente (baja lógica)',
            producto: resultado
        })
}

// ---> Gestión de imágenes
// Recibe un archivo por multer, lo guarda, y devuelve la ruta publica
export function subirImagen(req, res) {
    // Ejecutamos Multer manualmente adentro de la ruta
    upload(req, res, function (err) {
        
        // Manejo de Errores
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ mensaje: 'El archivo supera el límite de 5 MB' })
            }
            return res.status(400).json({ mensaje: `Error de carga: ${err.message}` })
        } else if (err) {
            if (err.message === 'TIPO_INVALIDO') {
                return res.status(400).json({ mensaje: 'Solo se aceptan imágenes (jpg, png, webp, gif)' })
            }
            return res.status(400).json({ mensaje: err.message })
        }

        // Validación de archivo vacío
        if (!req.file) {
            return res.status(400).json({ mensaje: 'No se recibió ningún archivo' })
        }

        // Respuesta Exitosa
        const rutaPublica = '/recursos/imagenes/productos/' + req.file.filename
        res.status(201).json({
            mensaje: 'Imagen subida exitosamente',
            url: rutaPublica,
            filename: req.file.filename
        })
    })
}

// Obtiene la URL guardada en BD, borra el archivo del disco y el registro.
export async function eliminarImagen(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID de imagen debe ser un número válido' })
    }

    const imagen = await modelo.obtenerImagenPorId(id)

    if (!imagen) {
        return res.status(404).json({ mensaje: 'Imagen no encontrada' })
    }
    if (imagen.error) {
        return res.status(500).json({ mensaje: 'Error al buscar la imagen' })
    }

    if (imagen.url && imagen.url.startsWith('/recursos/')) {
        borrarArchivo(rutaPublicaADisco(imagen.url))
    }

    const resultado = await modelo.eliminarImagenPorId(id)
    if (resultado.error) {
        return res.status(500).json({ mensaje: 'Error al eliminar la imagen de la base de datos' })
    }

    res.status(200).json({ mensaje: 'Imagen eliminada del disco y de la base de datos' })
}

// ---> Publicos (Lectura)
export async function obtenerProductosPublicos(req, res) {
    const destacados = req.query.destacados === 'true'
    const productos = await modelo.obtenerProductosPublicos(destacados)

    if (productos.error) {
        return res.status(500).json({ mensaje: 'Error al obtener el catálogo' })
    }
    if (productos.length === 0) {
        return res.status(200).json([])
    }

    res.json(productos.map(limpiarCampos))
}

export async function obtenerProductoPublicoPorId(req, res) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        return res.status(400).json({ mensaje: 'El ID del producto debe ser un número válido' })
    }

    const producto = await modelo.obtenerProductoPublicoPorId(id)

    if (producto.error) {
        return res.status(500).json({ mensaje: 'Error al obtener el producto' })
    }
    if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado o no disponible' })
    }

    res.json(limpiarCampos(producto))
}


// Helpers de respuesta publica

// Transforma el stock total a un string para la tienda publica
function censuraStock(stockTotal){
    const stock = Number(stockTotal)
    if(stock === 0) return 'Agotado'
    if(stock <= 3) return 'Últimas unidades'

    return 'Disponible'
}

// Limpia los campos sensibles antes de enviar un producto a la tienda
function limpiarCampos(producto){
    const { stock_total, stock_por_talle, talle_ids, color_ids, variantes, activo, ...resto } = producto

    const tallesSeguros = (stock_por_talle || []).map((st)=>{
        return {
            talle: st.talle,
            tieneStock: st.cantidad > 0
        }
    })

    return {
        ...resto,
        disponibilidad: censuraStock(stock_total),
        stock_por_talle: tallesSeguros
    }
}

// Helpers internos

// Convierte la ruta publica a su ruta absoluta para poder borrarla con fs
function rutaPublicaADisco(rutaPublica) {
    return path.join(__dirname, '../../public', rutaPublica)
}

// Borra un archivo del disco
function borrarArchivo(rutaDisco) {
    try {
        if (fs.existsSync(rutaDisco)) {
            fs.unlinkSync(rutaDisco)
        }
    } catch (err) {
        console.warn('No se pudo borrar el archivo:', rutaDisco, err.message)
    }
}