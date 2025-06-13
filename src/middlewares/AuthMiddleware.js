// src/middlewares/AuthMiddleware.js
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../utils/errors/TokenExpiredError.js';

class AuthMiddleware {
  constructor() {
    /**
     * Vinculação para grantir ao método handle o contexto 'this' correto
     * Ao usar bind(this) no método handle garantimos independentemente de como ou onde o método é chamado, 
     * this sempre se referirá à instância atual de AuthMiddleware.
     */
    this.handle = this.handle.bind(this);
  }

  async handle(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AuthenticationError("O token de autenticação não existe!");
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new AuthenticationError("Formato do token de autenticação inválido!");
      }

      // Verifica e decodifica o token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      if (!decoded) { // Se não ocorrer a decodificação do token
        throw new TokenExpiredError("O token JWT está expirado!");
      }

      // Se o token for válido, anexa o user_id à requisição
      req.user_id = decoded.id;
      next();

    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        next(new AuthenticationError("Token JWT inválido!"));
      } else if (err.name === 'TokenExpiredError') {
        next(new TokenExpiredError("O token JWT está expirado!"));
      } else {
        next(err); // Passa outros erros para o errorHandler
      }
    }
  }
}

// Instanciar e exportar apenas o método 'handle' como função de middleware
export default new AuthMiddleware().handle;
