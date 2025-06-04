import AuthenticationError from '../utils/errors/AuthenticationError.js';
import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

class LoginService {
   async autenticar(email, senha) {
        // Busca no banco de dados um usuário com o email fornecido, incluindo o campo 'senha'
        const usuario = await Usuario.findOne({ email }).select('+senha');

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

        if (!usuario || !senhaCorreta) {
            throw new AuthenticationError('Email ou senha inválidos');
        }

        const infoUser = {
            id: usuario._id,
            email: usuario.email,
        };

        // Gerando token jwt com as informações do usuário
        const token = jwt.sign(infoUser, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        return {
            menssagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                usuarioId: usuario._id,
                nome: usuario.nome
            }
        };
   }
}

export default LoginService;