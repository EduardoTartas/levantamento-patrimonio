import express from "express";
import InventarioController from '../controllers/InventarioController.js'
import { asyncWrapper } from '../utils/helpers/index.js';
//import AuthMiddleware from "../middlewares/AuthMiddleware.js";
//import authPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

const inventarioController = new InventarioController();

router
  // Rota para cadastrar novo inventário
  .post("/inventarios",/*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.criar.bind(inventarioController)))
  // Rota para listar inventários com filtros
  .get("/inventarios",/*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.listar.bind(inventarioController)))
  .get("/inventarios/:id",/*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.listar.bind(inventarioController)))
  // Rota para finalizar inventário ou editar inventário
  .patch("/inventarios/:id", /*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.atualizar.bind(inventarioController)))
  .put("/inventarios/:id", /*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.atualizar.bind(inventarioController)))
  // Rota para buscar inventário por ID
  .delete("/inventarios/:id",/*AuthMiddleware,authPermission*/asyncWrapper(inventarioController.deletar.bind(inventarioController)));

export default router;