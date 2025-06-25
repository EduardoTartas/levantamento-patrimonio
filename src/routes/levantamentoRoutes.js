import express from "express";
import LevantamentoController from "../controllers/LevantamentoController.js";
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
//import AuthPermission from "../middlewares/AuthPermission.js";
import { asyncWrapper } from '../utils/helpers/index.js';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

const levantamentoController = new LevantamentoController();

router
  // Rota para cadastrar novo levantamento
  .post("/levantamentos", AuthMiddleware, /*authPermission,*/ asyncWrapper(levantamentoController.criar.bind(levantamentoController)))
  
  // Rota para adicionar ou atualizar foto do bem
  .post("/levantamentos/fotos/:id", /*AuthMiddleware, authPermission,*/ upload.single('foto'), asyncWrapper(levantamentoController.adicionarFoto.bind(levantamentoController)))
  
  // Rota para listar todos os levantamentos cadastrados, com filtros opcionais
  .get("/levantamentos",  /*AuthMiddleware, authPermission,*/ asyncWrapper(levantamentoController.listar.bind(levantamentoController)))
  
  // Rota para obter dados detalhados de um levantamento específico
  .get("/levantamentos/:id",  /*AuthMiddleware, authPermission,*/ asyncWrapper(levantamentoController.listar.bind(levantamentoController)))

  // Rota para atualizar parcialmente um levantamento
  .patch("/levantamentos/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(levantamentoController.atualizar.bind(levantamentoController)))
  
  // Rota para excluir um levantamento
  .delete("/levantamentos/:id",  /*AuthMiddleware, authPermission,*/asyncWrapper(levantamentoController.deletar.bind(levantamentoController)))

  // Rota para excluir as fotos de um levantamento
  .delete("/levantamentos/fotos/:id",  /*AuthMiddleware, authPermission,*/asyncWrapper(levantamentoController.deletarFoto.bind(levantamentoController)));

export default router;