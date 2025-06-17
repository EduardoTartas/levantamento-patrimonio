import express from 'express';
import salaController from '../controllers/SalaController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const SalaController = new salaController(); 

router
    .get("/salas", /*AuthMiddleware, authPermission,*/ asyncWrapper(SalaController.listar.bind(SalaController)))
    .get("/salas/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(SalaController.listar.bind(SalaController)))

export default router;