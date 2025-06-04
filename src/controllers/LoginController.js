// src/controllers/LoginController.js
import LoginService from '../services/LoginService.js'
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';

class LoginController {
    constructor() {
        this.service = new LoginService();
    }

    // POST /login
    async login(req, res, next) {
        // Valida os dados enviados no corpo da requisição usando o esquema LoginSchema
        const result = LoginSchema.safeParse(req.body);

        if (!result.success) {
            // Captura o primeiro erro de validação e cria um erro de autenticação
            const error = result.error.errors[0];
            // Aqui está passando o erro para o middleware de tratamento de erros
            return next(new AuthenticationError(error.message));
        }

        const { email, senha } = req.body;

        const resultLogin = await this.service.autenticar(email, senha);
        return res.status(200).json(resultLogin);
    }
}

export default LoginController;