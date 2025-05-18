import express from 'express';
import campusController from '../controllers/CampusController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const CampusController = new campusController(); 

router
    .get("/campus", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.listar.bind(CampusController)))
    .get("/campus/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.listar.bind(CampusController)))
    .post("/campus", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.criar.bind(CampusController)))
    .patch("/campus/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.atualizar.bind(CampusController)))
    .put("/campus/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.atualizar.bind(CampusController)))
    .delete("/campus/:id", /*AuthMiddleware, authPermission,*/ asyncWrapper(CampusController.deletar.bind(CampusController)));

export default router;