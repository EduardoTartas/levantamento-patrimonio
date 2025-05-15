// src/controllers/LoginController.js
import Usuario from '../models/Usuario.js';
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';

class LoginController {
     constructor() {
    //     // Chamará o service    
     }

    validarDados() {
        // Valida os dados enviados no corpo da requisição usando o esquema LoginSchema
        const resultado = LoginSchema.safeparse(req.body);

        if (!resultado.success) {
            // Captura o primeiro erro de validação e cria um erro de autenticação
            const erro = resultado.error.errors[0];
            // Aqui está passando o erro para o middleware de tratamento de erros
            return next(new AuthenticationError(erro.message));
        }
    }

    // POST /login
    async login(req, res, next) {
        this.validarDados(req.body);

        const { email, senha } = req.body;

        // Busca no banco de dados um usuário com o email fornecido, incluindo o campo 'senha'
        const usuario = await Usuario.findOne({ email }).select('+senha');

        if (!usuario || usuario.senha !== senha) {
            return next(new AuthenticationError('Email ou senha inválidos'));
        }

        res.status(200).json({ mensagem: 'Login realizado com sucesso.' });
    }
}

export default LoginController;