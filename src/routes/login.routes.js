import express from 'express';

import LoginController from '../controllers/LoginController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

router.post('/login', asyncWrapper(LoginController.login.bind(LoginController)));

export default router;