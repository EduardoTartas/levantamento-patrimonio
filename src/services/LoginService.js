//src/services/LoginService.js
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';
import TokenExpiredError from "../utils/errors/TokenExpiredError.js";
import TokenInvalidError from "../utils/errors/TokenInvalidError.js";
import PasswordResetToken from "../models/PassResetToken.js";
import CustomError from "../utils/helpers/CustomError.js";
import SendMail from "../utils/SendMail.js";
import TokenUtil from "../utils/TokenUtil.js";

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
        const accessToken = TokenUtil.generateAccessToken(usuario);
        const refreshToken = TokenUtil.generateRefreshToken(usuario);

        // Salva o refresh token no banco
        await this.loginRepository.salvarRefreshToken(usuario._id, refreshToken)

        return {
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            },
            accessToken,
            refreshToken
        };
    };

    async refreshToken(token) {
        // Verificando se o token existe
        const tokenValido = await this.loginRepository.validarRefreshToken?.(token);

        if (!tokenValido) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'invalidToken',
                customMessage: 'Refresh token inválido ou expirado.'
            })
        }

        let dataToken;

        try {
            dataToken = jwt.verify(token, this.jwtRefreshSecret);
        } catch (err) {
            throw new TokenInvalidError("Token inválido");
        }

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

        const usuario = await this.loginRepository.buscarPorId(dataToken.id);

        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'userNotFound',
                customMessage: 'Usuário não encontrado.'
            });
        }

        const newAccessToken = TokenUtil.generateAccessToken(usuario);
        // Aqui irá ser gerado um novo refresh_token que ira rotacionar com o access_token
        const newRefreshToken = TokenUtil.generateRefreshToken(usuario);

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

        const infoEmail = {
            to: usuario.email,
            subject: "Recuperação de senha",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperação de Senha</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin-top: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="color: #007bff; font-size: 24px; margin: 0;">Recuperação de Senha</h1>
                </div>
                
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Olá <strong>${usuario.nome}</strong>,</p>
                
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, ignore este e-mail.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${urlRecuperacao}" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
                </div>
                
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:</p>
                
                <p style="font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${urlRecuperacao}</p>
                
                <p style="font-size: 14px; color: #666666; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">Este link expirará em 1 hora por motivos de segurança.</p>
                
                <div style="text-align: center; margin-top: 20px; color: #666666; font-size: 12px;">
                    <p>Este é um e-mail automático, por favor não responda.</p>
                </div>
                </div>
            </body>
            </html>
            `,
        };

        await SendMail.enviaEmail(infoEmail);
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

        const hash = await bcrypt.hash(novaSenha, 10);

        await this.loginRepository.atualizarSenha(usuario._id, hash);

        // Marcando o token como usado
        resetTokenDoc.used = true;
        await resetTokenDoc.save();

        return { mensagem: "Senha alterada com sucesso." };
    }

    async deletarRefreshToken(refreshToken) {
        return this.loginRepository.deleteRefreshToken(refreshToken);
    }
}