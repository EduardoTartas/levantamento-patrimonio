import express from 'express';
import multer from 'multer';
import ImportacaoController from '../controllers/ImportacaoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
const importacaoController = new ImportacaoController();

router
   .post("/csv/:campusId", upload.single('csv'), AuthMiddleware, AuthPermission, asyncWrapper(importacaoController.importarCSV.bind(importacaoController)));

export default router;