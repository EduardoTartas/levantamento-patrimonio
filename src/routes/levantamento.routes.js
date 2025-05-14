import express from "express";
// import LevantamentoController from "../controllers/LevantamentoController.js";
// import { asyncWrapper } from '../utils/helpers/index.js';
// import AuthMiddleware from "../middlewares/AuthMiddleware.js";
// import authPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

//const levantamentoController = new LevantamentoController();

router
  // Rota para listar bens de uma sala específica
  .get("levantamento/",/*AuthMiddleware, authPermission, asyncWrapper(levantamentoController.listarPorSala.bind(levantamentoController))*/)
  // Rota para obter detalhes completos de um bem patrimonial
  .get("levantamento/:tombo", /*AuthMiddleware, authPermission, asyncWrapper(levantamentoController.obterDetalhes.bind(levantamentoController))*/)
  // Rota para atualizar dados do bem no levantamento
  .patch("levantamento/:id", /*AuthMiddleware, authPermission, asyncWrapper(levantamentoController.atualizar.bind(levantamentoController))*/)
  // Rota para adicionar ou atualizar foto do bem
  .post("levantamento/:id/foto",/* AuthMiddleware, authPermission, asyncWrapper(levantamentoController.adicionarFoto.bind(levantamentoController))*/);

export default router;