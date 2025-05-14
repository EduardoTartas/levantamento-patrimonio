import express from 'express';

import UsuarioController from '../controllers/UsuarioController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

router
  .post('/usuarios', asyncWrapper(UsuarioController.criar))
  .get('/usuarios', asyncWrapper(UsuarioController.listar))
  .get('/usuarios/:id', asyncWrapper(UsuarioController.listar))
  .patch('/usuarios/:id', asyncWrapper(UsuarioController.atualizar))
  .delete('/usuarios/:id', asyncWrapper(UsuarioController.deletar))

export default router;
