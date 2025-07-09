import express from "express";
import InventarioController from '../controllers/InventarioController.js'
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AuthPermission from '../middlewares/AuthPermission.js';

const router = express.Router();

const inventarioController = new InventarioController();

router
  .post("/inventarios", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.criar.bind(inventarioController)))
  .get("/inventarios", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.listar.bind(inventarioController)))
  .get("/inventarios/:id", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.listar.bind(inventarioController)))
  .patch("/inventarios/:id", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.atualizar.bind(inventarioController)))
  .put("/inventarios/:id", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.atualizar.bind(inventarioController)))
  .delete("/inventarios/:id", AuthMiddleware, AuthPermission, asyncWrapper(inventarioController.deletar.bind(inventarioController)));

export default router;