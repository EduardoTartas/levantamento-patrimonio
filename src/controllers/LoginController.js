// src/controllers/LoginController.js
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginRepository } from '../repositories/LoginRepository.js';
import { LoginService } from '../services/LoginService.js';
import dotenv from 'dotenv';

dotenv.config();

class LoginController {
    constructor() {
        this.repository = new LoginRepository();
        this.service = new LoginService(
            process.env.JWT_SECRET, 
            process.env.JWT_EXPIRES_IN, 
            process.env.JWT_REFRESH_SECRET,
            process.env.JWT_REFRESH_EXPIRE_IN,
            this.repository
        );
    }

    // POST /login
    async login(req, res, next) {
        const { email, senha } = req.body;

        const usuario = await this.service.autenticar(email, senha);

        res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            ...usuario
        });

        next()
    }

    async refreshToken(req, res, next) {
        const { refresh_Token } = req.body;

        if (!refresh_Token) {
            throw new AuthenticationError('Token de atualização não fornecido.')
        }

        const tokens = await this.service.refreshToken(refresh_Token);

        res.status(200).json(tokens);
    }
}

export default LoginController;
