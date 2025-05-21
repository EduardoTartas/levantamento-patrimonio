import express from 'express';

import LoginController from '../controllers/LoginController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();
const loginController = new LoginController();

router  
  .post("/login", asyncWrapper(loginController.login.bind(loginController)))
  // .post("/recover", asyncWrapper(loginController.recuperaSenha.bind(loginController)))
  // .post("/logout", asyncWrapper(loginController.logout.bind(loginController)))
  // .post("/revoke", asyncWrapper(loginController.revoke.bind(loginController)))
  // .post("/refresh", asyncWrapper(loginController.refresh.bind(loginController)))
  // .post("/introspect", asyncWrapper(loginController.pass.bind(loginController))) // checa se o token é válido

export default router;