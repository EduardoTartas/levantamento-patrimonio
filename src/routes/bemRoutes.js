import express from 'express';
import bemController from '../controllers/BemController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const BemController = new bemController(); 

router
    .get("/bem", /*AuthMiddleware, authPermission,*/ asyncWrapper(BemController.listar.bind(BemController)))
    .get("/bem/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(BemController.listar.bind(BemController)))

export default router;