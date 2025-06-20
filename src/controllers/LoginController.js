// src/controllers/LoginController.js
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginRepository } from '../repositories/LoginRepository.js';
import { LoginService } from '../services/LoginService.js';
import dotenv from 'dotenv';

dotenv.config();

class LoginController {
    constructor() {
        this.service = new LoginService(
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN,
            process.env.JWT_REFRESH_SECRET,
            process.env.JWT_REFRESH_EXPIRE_IN,
            process.env.JWT_PASSWORD_RESET_SECRET,
            new LoginRepository()
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
    }

    async refreshToken(req, res, next) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AuthenticationError('Token de atualização não fornecido.')
        }

        const tokens = await this.service.refreshToken(refreshToken);

        res.status(200).json(tokens);
    }

    async recover(req, res, next) {
        const { email, token, novaSenha } = req.body;

        if (token && novaSenha) {
            const resultado = await this.service.redefinirSenha(token, novaSenha);
            return res.status(200).json(resultado);
        }

        if (email && !token && !novaSenha) {
            const resultado = await this.service.solicitarRecuperacao(email);
            return res.status(200).json(resultado);
        }

        return res.status(400).json({
            erro: "Parâmetros inválidos para recuperação de senha.",
            recebido: { email, token, novaSenha }
        });
    }

    async logout(req, res, next) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Token de refresh não fornecido." });
        }

        const result = await this.service.deletarRefreshToken(refreshToken);

        if (result.deletedCount === 0) {
            return res.status(400).json({ message: "Token não encontrado." });
        }

        return res.status(200).json({ message: "Logout realizado com sucesso." });
    }
}

export default LoginController;
