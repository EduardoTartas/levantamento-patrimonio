//src/services/LoginService.js
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';
import { NovaSenhaSchema } from "../utils/validators/schemas/zod/NovaSenhaSchema.js";
import TokenExpiredError from "../utils/errors/TokenExpiredError.js";
import TokenInvalidError from "../utils/errors/TokenInvalidError.js";
import PasswordResetToken from "../models/PassResetToken.js";
import CustomError from "../utils/helpers/CustomError.js";

export class LoginService {
    constructor(jwtSecret, jwtExpireIn = '15m', jwtRefreshSecret, jwtRefreshExpireIn = '7d', jwtPasswordResetSecret, loginRepository) {
        this.jwtSecret = jwtSecret;
        this.jwtExpireIn = jwtExpireIn;
        this.jwtRefreshSecret = jwtRefreshSecret;
        this.jwtRefreshExpireIn = jwtRefreshExpireIn;
        this.jwtPasswordResetSecret = jwtPasswordResetSecret
        this.loginRepository = loginRepository;
    }

    async autenticar(email, senha) {
        // Valida os dados enviados no corpo da requisição usando o esquema LoginSchema
        const resultado = LoginSchema.safeParse({ email, senha });

        if (!resultado.success) {
            // Captura o primeiro erro de validação e cria um erro de autenticação
            const erro = resultado.error.errors[0];
            // Aqui está passando o erro para o middleware de tratamento de erros
            throw new CustomError({
                statusCode: 400,
                errorType: 'validationError',
                field: erro.path?.[0] || null,
                details: resultado.error.errors,
                customMessage: erro.message
            });
        }

        const usuario = await this.loginRepository.buscarPorEmail(email);

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            throw new AuthenticationError('Email ou senha inválidos', 'email');
        };

        // gera o token jwt
        const accessToken = this._gerarAccessToken(usuario);
        const refreshToken = this._gerarRefreshToken(usuario);

        // Salva o refresh token no banco
        await this.loginRepository.salvarRefreshToken(usuario._id, refreshToken)

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

        let dataToken = jwt.verify(token, this.jwtRefreshSecret);

        /*Esse código limita a vida total da sessão, mesmo que os tokens estejam sendo renovados a cada acesso. */
        const tokenIat = dataToken.iat * 1000;// Converte para ms
        const nowDate = Date.now();

        const maxSessionTime = 7 * 24 * 60 * 60 * 1000;// Tempo máximo do refresh token(7d)

        if (nowDate - tokenIat > maxSessionTime) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'sessionExpired',
                customMessage: 'Sessão expirada, faça login novamente'
            });
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

        // Aqui deleta o antigo e salva o novo token
        await this.loginRepository.deleteRefreshToken(token);
        await this.loginRepository.salvarRefreshToken(dataToken.id, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    async solicitarRecuperacao(email) {
        const usuario = await this.loginRepository.buscarPorEmail(email);

        if (!usuario) {
            throw new CustomError({
                statusCode: 200, // Sim, pois isso é um comportamento de segurança (não revela existência do e-mail)
                errorType: 'emailNotFound',
                customMessage: "Se este e-mail estiver cadastrado, uma mensagem foi enviada."
            });
        }

        const expiresInMs = 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + expiresInMs);

        const token = jwt.sign(
            { id: usuario._id },
            this.jwtPasswordResetSecret,
            { expiresIn: '1hr' }
        );

        await PasswordResetToken.create({
            usuario: usuario._id,
            token,
            expiresAt
        });

        await this.enviarEmailRecuperacao(usuario, token);

        return {
            mensagem: "E-mail de recuperação enviado."
        };
    }

    async enviarEmailRecuperacao(usuario, token) {
        const baseUrl = process.env.RECUPERACAO_URL;
        const urlRecuperacao = `${baseUrl}?token=${token}`;

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
        let payload;

        try {
            payload = jwt.verify(token, this.jwtPasswordResetSecret);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new TokenExpiredError("O link de recuperação expirou. Solicite um novo.");
            } else if (err.name === 'JsonWebTokenError') {
                throw new TokenExpiredError("Token inválido.");
            } else {
                throw new TokenInvalidError("Não foi possível verificar o token.");
            }
        }

        const resetTokenDoc = await PasswordResetToken.findOne({ token });

        if (!resetTokenDoc || resetTokenDoc.used) {
            throw new TokenInvalidError("Token inválido, ou já ultilizado.");
        }

        if (resetTokenDoc.expiresAt < new Date()) {
            throw new TokenExpiredError("O link de recuperação expirou.");
        }

        const usuario = await this.loginRepository.buscarPorId(payload.id);
        console.log(usuario);


        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'userNotFound',
                customMessage: "Usuário não encontrado."
            });
        }

        const senhaValidada = NovaSenhaSchema.parse(novaSenha);
        const hash = await bcrypt.hash(senhaValidada, 10);

        await this.loginRepository.atualizarSenha(usuario._id, hash);

        // Marcando o token como usado
        resetTokenDoc.used = true;
        await resetTokenDoc.save();

        return { mensagem: "Senha alterada com sucesso." };
    }


}