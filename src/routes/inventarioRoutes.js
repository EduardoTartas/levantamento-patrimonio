import express from "express";
//import InventarioController from "../controllers/InventarioController.js";
//import { asyncWrapper } from '../utils/helpers/index.js';
//import AuthMiddleware from "../middlewares/AuthMiddleware.js";
//import authPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

//const inventarioController = new InventarioController();

router
  // Rota para cadastrar novo inventário
  .post("inventario/",/*AuthMiddleware,authPermission,asyncWrapper(inventarioController.cadastrar.bind(inventarioController))*/)
  // Rota para listar inventários com filtros
  .get("inventario/",/*AuthMiddleware,authPermission,asyncWrapper(inventarioController.listar.bind(inventarioController))*/)
  // Rota para finalizar inventário
  .patch("inventario/:id/finalizar",/*AuthMiddleware,authPermission,asyncWrapper(inventarioController.finalizar.bind(inventarioController))*/);

export default router;