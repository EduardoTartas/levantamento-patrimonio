//src/services/LoginService.js
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';


export class LoginService {
    constructor(jwtSecret, jwtExpireIn = '15m', jwtRefreshSecret, jwtRefreshExpireIn = '7d', loginRepository) {
        this.jwtSecret = jwtSecret;
        this.jwtExpireIn = jwtExpireIn;
        this.jwtRefreshSecret = jwtRefreshSecret;
        this.jwtRefreshExpireIn = jwtRefreshExpireIn;
        this.loginRepository = loginRepository;
    }

    async autenticar(email, senha) {
        // Valida os dados enviados no corpo da requisição usando o esquema LoginSchema
        const resultado = LoginSchema.safeParse({ email, senha });

        if (!resultado.success) {
            // Captura o primeiro erro de validação e cria um erro de autenticação

            const erro = resultado.error.errors[0];
            // Aqui está passando o erro para o middleware de tratamento de erros
            throw new AuthenticationError(erro.message);
        }

        const usuario = await this.loginRepository.buscarPorEmail(email);

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            throw new AuthenticationError('Email ou senha inválidos');
        };

        // gera o token jwt
        const accessToken = this._gerarAccessToken(usuario);
        const refreshToken = this._gerarRefreshToken(usuario);

        return {
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email
            },
            accessToken,
            refreshToken
        };
    };

    _gerarAccessToken(usuario) {
        return jwt.sign(
            { id: usuario._id, email: usuario.email },
            this.jwtSecret,
            { expiresIn: this.jwtExpireIn }
        );
    };

    _gerarRefreshToken(usuario) {
        return jwt.sign(
            { id: usuario._id, email: usuario.email },
            this.jwtRefreshSecret,
            { expiresIn: this.jwtRefreshExpireIn }
        );
    };

    async refreshToken(token) {
        const dataToken = jwt.verify(token, this.jwtRefreshSecret);

        /*Esse código limita a vida total da sessão, mesmo que os tokens estejam sendo renovados a cada acesso. */
        const tokenIat = dataToken.iat * 1000;// Converte para ms
        const nowDate = Date.now();

        const maxSessionTime = 7 * 24 * 60 * 60 * 1000;// Tempo máximo do refresh token(7d)

        if (nowDate - tokenIat > maxSessionTime) {
            throw new AuthenticationError('Sessão expirada, faça login novamente');
        };

        const newAccessToken = jwt.sign(
            { id: dataToken.id, email: dataToken.email },
            this.jwtSecret,
            { expiresIn: this.jwtExpireIn }
        );

        // Aqui irá ser gerado um novo refresh_token que ira rotacionar com o access_token
        const newRefreshToken = jwt.sign(
            { id: dataToken.id, email: dataToken.email },
            this.jwtRefreshSecret,
            { expiresIn: this.jwtRefreshExpireIn }
        );

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    async solicitarRecuperacao(email) {
        const usuario = await this.loginRepository.buscarPorEmail(email);

        if (!usuario) {
            throw new AuthenticationError("E-mail não existe.");
        }

        const token = jwt.sign(
            { id: usuario._id },
            this.jwtSecret,
            { expiresIn: this.jwtExpireIn }
        );

        await this.enviarEmailRecuperacao(usuario, token);

        return {
            mensagem: "E-mail de recuperação enviado."
        };
    }

    async enviarEmailRecuperacao(usuario, token) {
        const urlRecuperacao = `http://localhost:3001/redefinir-senha?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: usuario.email,
            subject: 'Recuperação de senha',
            html: `
            <h1>Recuperação de senha</h1>
            <p>Olá ${usuario.nome},</p>
            <p>Clique no link abaixo para redefinir sua senha:</p>
            <a href="${urlRecuperacao}">Redefinir senha</a>
            <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
        `
        });
    }

    async redefinirSenha(token, novaSenha) {
        const payload = jwt.verify(token, this.jwtSecret);
        const usuario = await this.loginRepository.buscarPorId(payload.id);

        if (!usuario) {
            throw new AuthenticationError("Usuário não encontrado.");
        }

        usuario.senha = novaSenha;
        await this.loginRepository.atualizarSenha(usuario._id, novaSenha);

        return { mensagem: "Senha alterada com sucesso." };
    }
}
