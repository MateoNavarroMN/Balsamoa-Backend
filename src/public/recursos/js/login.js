document.addEventListener('DOMContentLoaded', () => {
    inicializarVerPassword()
    inicializarFormulario()
})

function inicializarVerPassword() {
    const btn = document.getElementById('btn-ver-password')
    const input = document.getElementById('login-password')
    const icono = document.getElementById('icono-ver-password')

    btn.addEventListener('click', () => {
        const esPassword = input.type === 'password'
        input.type = esPassword ? 'text' : 'password'
        icono.className = esPassword ? 'ti ti-eye-off' : 'ti ti-eye'
    })
}

function inicializarFormulario() {
    const form = document.getElementById('form-login')
    form.addEventListener('submit', manejarSubmit)

    // Limpia el error del campo apenas el usuario vuelve a escribir
    document.getElementById('login-email').addEventListener('input', () => limpiarErrorCampo('email'))
    document.getElementById('login-password').addEventListener('input', () => limpiarErrorCampo('password'))
}

async function manejarSubmit(evento) {
    evento.preventDefault()
    ocultarAlerta()

    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value

    const esValido = validarCampos(email, password)
    if (!esValido) return

    establecerCargando(true)

    try {
        const respuesta = await fetch('/api/v1/autenticacion/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // necesario para que el navegador guarde la cookie HttpOnly
            body: JSON.stringify({ email, password })
        })

        const datos = await respuesta.json()

        if (!respuesta.ok) {
            mostrarAlerta(mapearMensajeError(respuesta.status, datos.mensaje))
            establecerCargando(false)
            return
        }

        // Login exitoso: la cookie ya quedó guardada por el servidor.
        // Redirigimos al panel de administración.
        window.location.href = '/admin'

    } catch (error) {
        console.error('Error de red en login:', error)
        mostrarAlerta('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.')
        establecerCargando(false)
    }
}

function validarCampos(email, password) {
    let valido = true

    if (!email) {
        marcarErrorCampo('email', 'Ingresá tu email')
        valido = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        marcarErrorCampo('email', 'Ingresá un email válido')
        valido = false
    }

    if (!password) {
        marcarErrorCampo('password', 'Ingresá tu contraseña')
        valido = false
    }

    return valido
}

function marcarErrorCampo(campo, mensaje) {
    document.getElementById(`login-${campo}`).classList.add('input-invalido')
    const error = document.getElementById(`error-${campo}`)
    error.textContent = mensaje
    error.classList.add('visible')
}

function limpiarErrorCampo(campo) {
    document.getElementById(`login-${campo}`).classList.remove('input-invalido')
    const error = document.getElementById(`error-${campo}`)
    error.textContent = ''
    error.classList.remove('visible')
}

function mostrarAlerta(mensaje) {
    const alerta = document.getElementById('login-alerta')
    document.getElementById('login-alerta-texto').textContent = mensaje
    alerta.classList.add('visible')
}

function ocultarAlerta() {
    document.getElementById('login-alerta').classList.remove('visible')
}

function mapearMensajeError(status, mensajeServidor) {
    if (mensajeServidor) return mensajeServidor

    if (status === 400) return 'Completá tu email y contraseña.'
    if (status === 401) return 'Credenciales inválidas.'
    return 'Ocurrió un error inesperado. Intentá de nuevo en unos minutos.'
}

function establecerCargando(estaCargando) {
    const boton = document.getElementById('btn-login')
    const texto = document.getElementById('btn-login-texto')
    const spinner = document.getElementById('btn-login-spinner')

    boton.disabled = estaCargando
    texto.textContent = estaCargando ? 'Ingresando...' : 'Iniciar sesión'
    spinner.style.display = estaCargando ? 'inline-block' : 'none'
}