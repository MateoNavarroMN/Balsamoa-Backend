----- Creacion de Tablas

-- CATALOGO Y ATRIBUTOS
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE talles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    orden INTEGER DEFAULT 0
);

CREATE TABLE colores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    hex VARCHAR(7)
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    destacado BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    orden INTEGER DEFAULT 1
);

CREATE TABLE variantes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    talle_id INTEGER REFERENCES talles(id) ON DELETE RESTRICT,
    color_id INTEGER REFERENCES colores(id) ON DELETE RESTRICT,
    stock INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    UNIQUE (producto_id, talle_id, color_id)
);

-- USUARIOS Y ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rol_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT true,
    sesion_id VARCHAR(255)
);

CREATE TABLE datos_envio (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    calle VARCHAR(200) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- COMPRAS Y PAGOS
CREATE TABLE estados_pedido (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    orden INTEGER DEFAULT 0
);

CREATE TABLE metodos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    datos_envio_id INTEGER REFERENCES datos_envio(id) ON DELETE RESTRICT,
    total DECIMAL(10, 2) NOT NULL,
    estado_pedido_id INTEGER REFERENCES estados_pedido(id) ON DELETE RESTRICT,
    descuento DECIMAL(10, 2) DEFAULT 0,
    notas TEXT,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalles_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    metodo_pago_id INTEGER REFERENCES metodos_pago(id) ON DELETE RESTRICT,
    estado_pago VARCHAR(50) DEFAULT 'pendiente',
    monto DECIMAL(10, 2) NOT NULL,
    comprobante_url VARCHAR(255),
    mp_preference_id VARCHAR(100),
    mp_payment_id VARCHAR(100),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EXTRAS
CREATE TABLE carrito_compra (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    sesion_id VARCHAR(100)
);

CREATE TABLE newsletter_suscriptores (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

---- Creacion de la vista

CREATE OR REPLACE VIEW vista_catalogo_productos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.categoria_id,
    c.nombre AS categoria,
    p.precio,
    p.destacado,
    p.activo,
    p.fecha_creacion,
    -- Obtenemos solo la primera imagen según el orden
    (
        SELECT url 
        FROM producto_imagenes pi 
        WHERE pi.producto_id = p.id 
        ORDER BY orden ASC 
        LIMIT 1
    ) AS imagen_principal,
    -- Sumamos el stock total de todas las variantes del producto
    (
        SELECT COALESCE(SUM(v.stock), 0) 
        FROM variantes v 
        WHERE v.producto_id = p.id
    ) AS stock_total,
    -- Generamos el array de objetos para los talles: [{talle: 'S', cantidad: 10}, ...]
    (
        SELECT COALESCE(json_agg(json_build_object('talle', sub.talle, 'cantidad', sub.cantidad)), '[]'::json)
        FROM (
            SELECT t.nombre AS talle, SUM(v.stock) AS cantidad
            FROM variantes v
            JOIN talles t ON v.talle_id = t.id
            WHERE v.producto_id = p.id
            GROUP BY t.id, t.nombre, t.orden
            ORDER BY t.orden
        ) sub
    ) AS stock_por_talle,
    -- Generamos un array plano con los hex de los colores: ['#FFFFFF', '#000000']
    (
        SELECT COALESCE(json_agg(DISTINCT col.hex), '[]'::json)
        FROM variantes v
        JOIN colores col ON v.color_id = col.id
        WHERE v.producto_id = p.id AND col.hex IS NOT NULL
    ) AS colores_hex,
    -- Todas las imágenes ordenadas [{url, orden}]
    (
        SELECT COALESCE(
            json_agg(
                json_build_object('url', pi.url, 'orden', pi.orden)
                ORDER BY pi.orden ASC
            ),
            '[]'::json
        )
        FROM producto_imagenes pi
        WHERE pi.producto_id = p.id
    ) AS imagenes,
    -- IDs de talles con variantes [1, 2, 3]
    (
        SELECT COALESCE(
            json_agg(DISTINCT v.talle_id ORDER BY v.talle_id),
            '[]'::json
        )
        FROM variantes v
        WHERE v.producto_id = p.id
    ) AS talle_ids,

    -- IDs de colores con variantes [1, 2]
    (
        SELECT COALESCE(
            json_agg(DISTINCT v.color_id ORDER BY v.color_id),
            '[]'::json
        )
        FROM variantes v
        WHERE v.producto_id = p.id
    ) AS color_ids,

    -- Variantes completas [{talle_id, color_id, stock, activo}]
    (
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'talle_id', v.talle_id,
                    'color_id', v.color_id,
                    'stock',    v.stock,
                    'activo',   v.activo
                )
            ),
            '[]'::json
        )
        FROM variantes v
        WHERE v.producto_id = p.id
    ) AS variantes

FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id;

----- Datos Iniciales

-- 1. Insertamos las Categorías
INSERT INTO categorias (id, nombre, descripcion) VALUES
(1, 'Hoodie', 'Buzos de alta calidad con y sin capucha'),
(2, 'Remera', 'Remeras de algodón premium');

-- 2. Insertamos los Talles
INSERT INTO talles (id, nombre, orden) VALUES
(1, 'S', 1), 
(2, 'M', 2), 
(3, 'L', 3), 
(4, 'XL', 4), 
(5, 'XXL', 5);

-- 3. Insertamos los Colores
INSERT INTO colores (id, nombre, hex) VALUES
(1, 'Blanco', '#F5F5F5'), 
(2, 'Negro', '#1A1A1A'), 
(3, 'Verde', '#4A5D23'), 
(4, 'Beige', '#D5C7A8'), 
(5, 'Azul', '#1A365D'), 
(6, 'Gris Claro', '#D3D3D3'), 
(7, 'Gris Oscuro', '#4A4A4A'),
(8, 'Marrón', '#5C4033');

-- 4. Insertamos los Productos
INSERT INTO productos (id, nombre, descripcion, precio, categoria_id, destacado, activo) VALUES
(1, 'Hoodie Basic Blanco', 'Buzo con capucha blanco o hueso. Pequeño logo negro en el pecho.', 40000.00, 1, false, true),
(2, 'Hoodie Basic Negro', 'Buzo con capucha negro, con logo blanco en el pecho.', 40000.00, 1, false, true),
(3, 'Hoodie Basic Verde', 'Buzo con capucha verde oliva o militar.', 40000.00, 1, true, true),
(4, 'Remera Blanca Guardapampa', 'Remera de manga corta color crema con logo en el pecho.', 30000.00, 2, true, true),
(5, 'Remera Verde Woke UP', 'Remera verde oscuro, con logo dorado en el pecho.', 35000.00, 2, false, true),
(6, 'Hoodie Beige Guardapampa', 'Buzo de cuello redondo (sin capucha) en color beige.', 45000.00, 1, false, true),
(7, 'Hoodie Azul Guardapampa', 'Buzo con capucha azul royal intenso.', 55000.00, 1, false, true),
(8, 'Hoodie Basic Gris Claro', 'Buzo gris melange claro.', 40000.00, 1, false, true),
(9, 'Hoodie Basic Gris Oscuro', 'Buzo con capucha gris carbón.', 40000.00, 1, true, true),
(10, 'Remera Guardapampa', 'Remera manga corta beige claro con logo pequeño.', 35000.00, 2, false, true);

-- 5. Vinculamos las Imágenes
INSERT INTO producto_imagenes (producto_id, url, orden) VALUES
(1, '/recursos/imagenes/productos/Hoodie Basic Blanco.webp', 1),
(2, '/recursos/imagenes/productos/Hoodie Basic Negro.webp', 1),
(3, '/recursos/imagenes/productos/Hoodie Basic Verde.webp', 1),
(4, '/recursos/imagenes/productos/Remera Blanca Guardapampa.webp', 1),
(5, '/recursos/imagenes/productos/Remera Verde Woke UP.webp', 1),
(6, '/recursos/imagenes/productos/Hoodie Beige Guardapampa.webp', 1),
(7, '/recursos/imagenes/productos/Hoodie Azul Guardapampa.webp', 1),
(8, '/recursos/imagenes/productos/Hoodie Basic Gris Claro.webp', 1),
(9, '/recursos/imagenes/productos/Hoodie Basic Gris Oscuro.webp', 1),
(10, '/recursos/imagenes/productos/Remera Guardapampa.webp', 1);

-- 6. Motor de Variantes
INSERT INTO variantes (producto_id, talle_id, color_id, stock) VALUES
-- Hoodie Blanco (Solo S, probando "Últimas unidades")
(1, 1, 1, 2),
-- Hoodie Negro (S agotado, M normal)
(2, 1, 2, 0), 
(2, 2, 2, 15),
-- Hoodie Verde (S, M, L normales)
(3, 1, 3, 15), 
(3, 2, 3, 15), 
(3, 3, 3, 15),
-- Remera Blanca (L, XL con stock bajo)
(4, 3, 1, 3), 
(4, 4, 1, 1),
-- Remera Verde Woke UP (Mucho stock y todos los talles)
(5, 1, 3, 20), 
(5, 2, 3, 20), 
(5, 3, 3, 20), 
(5, 4, 3, 20),
-- Hoodie Beige Guardapampa (Totalmente Agotado)
(6, 2, 4, 0), 
(6, 3, 4, 0),
-- Hoodie Azul (S, XL)
(7, 1, 5, 10), 
(7, 4, 5, 10),
-- Hoodie Gris Claro
(8, 1, 6, 12), 
(8, 3, 6, 15),
-- Hoodie Gris Oscuro
(9, 3, 7, 8), 
(9, 4, 7, 5),
-- Remera Guardapampa (Solo XL)
(10, 4, 4, 15);

-- 7. Ajuste de seguridad PostgreSQL (Actualizamos las secuencias para que los INSERT desde la web no choquen)
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
SELECT setval('talles_id_seq', (SELECT MAX(id) FROM talles));
SELECT setval('colores_id_seq', (SELECT MAX(id) FROM colores));
SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));
SELECT setval('producto_imagenes_id_seq', COALESCE((SELECT MAX(id) FROM producto_imagenes), 1));
SELECT setval('variantes_id_seq', COALESCE((SELECT MAX(id) FROM variantes), 1));

INSERT INTO roles (id, nombre, descripcion) 
VALUES (1, 'Administrador', 'Acceso total al panel de control de Balsamoa')

INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo) 
VALUES (
    'Admin Balsamoa', 
    'admin@balsamoa.com', 
    '$2b$10$4J.A45VnpRgqspUxC6eza.GQ/YXf8qLEJaWpkgh1vFEJBfTEvwtKO', 
    1,
    true
);