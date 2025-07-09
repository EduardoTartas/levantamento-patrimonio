import express from 'express';
import campusController from '../controllers/CampusController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';

const router = express.Router();
const CampusController = new campusController(); 

router
    .get("/campus", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.listar.bind(CampusController)))
    .get("/campus/:id", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.listar.bind(CampusController)))
    .post("/campus", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.criar.bind(CampusController)))
    .patch("/campus/:id", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.atualizar.bind(CampusController)))
    .put("/campus/:id", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.atualizar.bind(CampusController)))
    .delete("/campus/:id", AuthMiddleware, AuthPermission, asyncWrapper(CampusController.deletar.bind(CampusController)));

export default router;