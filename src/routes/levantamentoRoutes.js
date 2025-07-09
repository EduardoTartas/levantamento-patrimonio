import express from "express";
import LevantamentoController from "../controllers/LevantamentoController.js";
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from "../middlewares/AuthPermission.js";
import { asyncWrapper } from '../utils/helpers/index.js';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

const levantamentoController = new LevantamentoController();

router

  .post("/levantamentos", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.criar.bind(levantamentoController)))
  .post("/levantamentos/fotos/:id", AuthMiddleware, AuthPermission, upload.single('foto'), asyncWrapper(levantamentoController.adicionarFoto.bind(levantamentoController)))
  .get("/levantamentos", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.listar.bind(levantamentoController)))
  .get("/levantamentos/:id", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.listar.bind(levantamentoController)))
  .patch("/levantamentos/:id", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.atualizar.bind(levantamentoController)))
  .delete("/levantamentos/:id", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.deletar.bind(levantamentoController)))
  .delete("/levantamentos/fotos/:id", AuthMiddleware, AuthPermission, asyncWrapper(levantamentoController.deletarFoto.bind(levantamentoController)));

export default router;