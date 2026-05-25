import { Router } from "express"

const routerAdmin = new Router()

routerAdmin.get('/admin', (req, res)=>{
    res.json({ mensaje: 'Estas en admin' })
})

export default routerAdmin