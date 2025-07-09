import express from 'express';
import salaController from '../controllers/SalaController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';

const router = express.Router();
const SalaController = new salaController(); 

router
    .get("/salas", AuthMiddleware, AuthPermission, asyncWrapper(SalaController.listar.bind(SalaController)))
    .get("/salas/:id", AuthMiddleware, AuthPermission, asyncWrapper(SalaController.listar.bind(SalaController)))

export default router;