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
    nombre VARCHAR(50) NOT NULL
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
    activo BOOLEAN DEFAULT true
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


----- Datos Iniciales

-- 1. Insertamos las Categorías
INSERT INTO categorias (id, nombre, descripcion) VALUES
(1, 'Hoodie', 'Buzos de alta calidad con y sin capucha'),
(2, 'Remera', 'Remeras de algodón premium');

-- 2. Insertamos los Talles (con su orden lógico)
INSERT INTO talles (id, nombre, orden) VALUES
(1, 'S', 1), (2, 'M', 2), (3, 'L', 3), (4, 'XL', 4);

-- 3. Insertamos los Colores
INSERT INTO colores (id, nombre) VALUES
(1, 'Blanco'), (2, 'Negro'), (3, 'Verde'), (4, 'Beige'), 
(5, 'Azul'), (6, 'Gris Claro'), (7, 'Gris Oscuro');

-- 4. Insertamos los Productos Base
INSERT INTO productos (id, nombre, descripcion, precio, categoria_id, destacado, activo) VALUES
(1, 'Hoodie Basic Blanco', 'Un buzo con capucha de color blanco o hueso. Tiene un pequeño logo negro en el pecho (lado izquierdo) y una etiqueta en el borde inferior.', 40000.00, 1, false, true),
(2, 'Hoodie Basic Negro', 'Un buzo con capucha de color negro, con un logo de la marca en color blanco en el pecho.', 40000.00, 1, false, true),
(3, 'Hoodie Basic Verde', 'Un buzo con capucha de color verde oliva o militar, con un pequeño logo en el pecho.', 40000.00, 1, true, true),
(4, 'Remera Blanca Guardapampa', 'Una remera de manga corta en color blanco o crema. Presenta un pequeño logo rectangular en el pecho, lado izquierdo.', 30000.00, 2, true, true),
(5, 'Remera Verde Woke UP', 'Una remera de manga corta en color verde oscuro, con un pequeño logo (posiblemente bordado) en color amarillo o dorado en el pecho.', 35000.00, 2, false, true),
(6, 'Hoodie Beige Guardapampa', 'Un buzo de cuello redondo (sin capucha) en color beige o marrón claro.', 45000.00, 1, false, true),
(7, 'Hoodie Azul Guardapampa', 'Un buzo (hoodie) con capucha de color azul royal intenso.', 55000.00, 1, false, true),
(8, 'Hoodie Basic Gris Claro', 'Un buzo con capucha de color gris melange claro, con un logo discreto en el pecho.', 40000.00, 1, false, true),
(9, 'Hoodie Basic Gris Oscuro', 'Un buzo con capucha de color gris oscuro o carbón.', 40000.00, 1, true, true),
(10, 'Remera Guardapampa', 'Una remera de manga corta en color beige claro o crema, también con un logo pequeño en el pecho.', 35000.00, 2, false, true);

-- 5. Vinculamos las Imágenes
INSERT INTO producto_imagenes (producto_id, url, orden) VALUES
(1, './recursos/imagenes/productos/Hoodie Basic Blanco.webp', 1),
(2, './recursos/imagenes/productos/Hoodie Basic Negro.webp', 1),
(3, './recursos/imagenes/productos/Hoodie Basic Verde.webp', 1),
(4, './recursos/imagenes/productos/Remera Blanca Guardapampa.webp', 1),
(5, './recursos/imagenes/productos/Remera Verde Woke UP.webp', 1),
(6, './recursos/imagenes/productos/Hoodie Beige Guardapampa.webp', 1),
(7, './recursos/imagenes/productos/Hoodie Azul Guardapampa.webp', 1),
(8, './recursos/imagenes/productos/Hoodie Basic Gris Claro.webp', 1),
(9, './recursos/imagenes/productos/Hoodie Basic Gris Oscuro.webp', 1),
(10, './recursos/imagenes/productos/Remera Guardapampa.webp', 1);

-- 6. Creamos el Motor de Variantes (Cruzando Productos, Talles y Colores)
INSERT INTO variantes (producto_id, talle_id, color_id, stock) VALUES
-- Hoodie Blanco (Solo S)
(1, 1, 1, 15),
-- Hoodie Negro (S, M)
(2, 1, 2, 15), 
(2, 2, 2, 15),
-- Hoodie Verde (S, M, L)
(3, 1, 3, 15), 
(3, 2, 3, 15), 
(3, 3, 3, 15),
-- Remera Blanca Guardapampa (L, XL)
(4, 3, 1, 15), 
(4, 4, 1, 15),
-- Remera Verde Woke UP (S, M, L, XL)
(5, 1, 3, 15), 
(5, 2, 3, 15), 
(5, 3, 3, 15), 
(5, 4, 3, 15),
-- Hoodie Beige Guardapampa (M, L)
(6, 2, 4, 15), 
(6, 3, 4, 15),
-- Hoodie Azul Guardapampa (S, XL)
(7, 1, 5, 15), 
(7, 4, 5, 15),
-- Hoodie Gris Claro (S, L)
(8, 1, 6, 15), 
(8, 3, 6, 15),
-- Hoodie Gris Oscuro (L, XL)
(9, 3, 7, 15), 
(9, 4, 7, 15),
-- Remera Guardapampa (Solo XL)
(10, 4, 4, 15);

-- 7. Ajuste de seguridad PostgreSQL (Para que los IDs automáticos sigan desde el 11)
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
SELECT setval('talles_id_seq', (SELECT MAX(id) FROM talles));
SELECT setval('colores_id_seq', (SELECT MAX(id) FROM colores));
SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));