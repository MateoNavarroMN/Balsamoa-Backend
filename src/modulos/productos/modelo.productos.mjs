export async function obtenerProductosApi(){
    try {
        const respuestaApi = await fetch('https://69d676ce1c120e733cce4248.mockapi.io/productos-balsamoa')
        const datosApi = respuestaApi.json()
        return datosApi
    } catch (error) {
        return { mensaje: error}
    }
}