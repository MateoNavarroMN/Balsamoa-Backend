const CarruselImagenes = document.getElementById('id_carruselImagenes')
const BtnAnterior = document.getElementById('id_btnAnterior')
const BtnSiguiente = document.getElementById('id_btnSiguiente')
const contenedorIndicadores = document.getElementById('id_indicadores')

let imagenActual = 0

function crearIndicadores() {
    let htmlIndicadores = ''
    
    for (let i = 0; i < 3; i++) {
        const claseActivo = i === 0 ? 'activo' : ''
        htmlIndicadores += `<div class="indicador ${claseActivo}"></div>`
    }
    
    contenedorIndicadores.insertAdjacentHTML('beforeend', htmlIndicadores)

    const indicadores = document.querySelectorAll('.indicador')
    indicadores.forEach((indicador, indice) => {
        indicador.addEventListener('click', function() {
            irAImagen(indice)
        })
    })
}

function irAImagen(indice) {
    imagenActual = indice
    CarruselImagenes.style.transform = `translateX(${-100 * imagenActual}%)`
    actualizarIndicadores()
}

function actualizarIndicadores() {
    const indicadores = document.querySelectorAll('.indicador')
    indicadores.forEach((indicador, indice) => {
        if (indice === imagenActual) {
            indicador.classList.add('activo')
        } else {
            indicador.classList.remove('activo')
        }
    })
}

function siguienteImagen() {
    imagenActual = (imagenActual + 1) % 3
    irAImagen(imagenActual)
}

function imagenAnterior() {
    imagenActual = (imagenActual - 1 + 3) % 3
    irAImagen(imagenActual)
}

BtnSiguiente.addEventListener('click', siguienteImagen)
BtnAnterior.addEventListener('click', imagenAnterior)

setInterval(siguienteImagen, 3000)

crearIndicadores()