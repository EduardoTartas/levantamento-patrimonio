import express from "express";
import RelatorioController from "../controllers/RelatorioController.js";
import {asyncWrapper} from '../utils/helpers/index.js';
//import AuthMiddleware from "../middlewares/AuthMiddleware.js";
//import authPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

const relatorioController = new RelatorioController();

// Espera os parâmetros de query: inventarioId (obrigatório), sala (opcional), tipoRelatorio (obrigatório)
router.get("/relatorios",/*AuthMiddleware,authPermission,*/ asyncWrapper(relatorioController.gerar.bind(relatorioController)));

export default router;