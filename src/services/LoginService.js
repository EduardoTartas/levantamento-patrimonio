//src/services/LoginService.js
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

import Usuario from '../models/Usuario.js';
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';


export class LoginService {
    constructor(jwtSecret, jwtExpireIn = '30min', loginRepository) {
        this.jwtSecret = jwtSecret;
        this.jwtExpireIn = jwtExpireIn;
        this.loginRepository = loginRepository
    }

    async autenticar(email, senha) {
        // Valida os dados enviados no corpo da requisição usando o esquema LoginSchema
        const resultado = LoginSchema.safeParse({ email, senha });

        if (!resultado.success) {
            // Captura o primeiro erro de validação e cria um erro de autenticação

            const erro = resultado.error.errors[0];
            // Aqui está passando o erro para o middleware de tratamento de erros
            return next(new AuthenticationError(erro.message));
        }

        const usuario = await this.loginRepository.buscarPorEmail(email);

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            return next(new AuthenticationError('Email ou senha inválidos'));
        };

        // gera o token jwt
        const token = this._gerarToken(usuario);

        return {
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email
            },
            token,
        };
    };

    _gerarToken(usuario) {
        return jwt.sign(
            { id: usuario._id, email: usuario.email },
            this.jwtExpireIn,
            { expiresIn: this.jwtExpireIn }
        );
    };
}