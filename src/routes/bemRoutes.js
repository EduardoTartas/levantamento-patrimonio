import express from 'express';
import bemController from '../controllers/BemController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';

const router = express.Router();
const BemController = new bemController(); 

router
    .get("/bens", AuthMiddleware, AuthPermission, asyncWrapper(BemController.listar.bind(BemController)))
    .get("/bens/:id", AuthMiddleware, AuthPermission, asyncWrapper(BemController.listar.bind(BemController)))

export default router;