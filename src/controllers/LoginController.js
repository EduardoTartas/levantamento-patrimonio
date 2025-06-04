// src/controllers/LoginController.js
import { LoginRepository } from '../repositories/LoginRepository.js';
import { LoginService } from '../services/LoginService.js';
import dotenv from 'dotenv';

dotenv.config();

class LoginController {
    constructor() {
        this.repository = new LoginRepository;
        this.service = new LoginService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN, this.repository);
    }

    // POST /login
    async login(req, res, next) {
        const { email, senha } = req.body;

        const usuario = await this.service.autenticar(email, senha);

        res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            ...usuario
        });
    }
}

export default LoginController;
