import express from "express";
//import ImportacaoController from "../controllers/ImportacaoController.js";
//import { asyncWrapper } from '../utils/helpers/index.js';
//import AuthMiddleware from "../middlewares/AuthMiddleware.js";
//import authPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

//const importacaoController = new ImportacaoController();

router
  // Rota para importação de dados via CSV
  .post("/csv",/*AuthMiddleware,authPermission,asyncWrapper(importacaoController.importarCSV.bind(importacaoController))*/);

export default router;
