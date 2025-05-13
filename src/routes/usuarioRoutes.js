import express from 'express';

import usuarioController from '../controllers/UsuarioController.js';

import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const UsuarioController = new usuarioController(); 

router
    .get("/usuarios", /*AuthMiddleware, *authPermission,*/ asyncWrapper(UsuarioController.listar.bind(UsuarioController)))
    .get("/usuarios/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(UsuarioController.listar.bind(UsuarioController)))
    .post("/usuarios", /*AuthMiddleware, authPermission,*/ asyncWrapper(UsuarioController.criar.bind(UsuarioController)))
    .patch("/usuarios/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(UsuarioController.atualizar.bind(UsuarioController)))
    .put("/usuarios/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(UsuarioController.atualizar.bind(UsuarioController)))
    .delete("/usuarios/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(UsuarioController.deletar.bind(UsuarioController)))

export default router;
