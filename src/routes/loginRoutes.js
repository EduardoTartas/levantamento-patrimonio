import express from 'express';

import LoginController from '../controllers/LoginController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const loginController = new LoginController();

router.post('/login', asyncWrapper(loginController.login.bind(loginController)));

export default router;