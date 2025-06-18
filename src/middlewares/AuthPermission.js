// middlewares/AuthPermission.js
import PermissionService from '../services/PermissionService.js';
import Rota from '../models/Rota.js';
import { CustomError, errorHandler, messages } from '../utils/helpers/index.js';

class AuthPermission {
  constructor() {
    this.permissionService = PermissionService;
    this.Rota = Rota;
    this.messages = messages;


    // Vincula o método handle ao contexto da instância
    this.handle = this.handle.bind(this);
  }

  async handle(req, res, next) {
    try {
      // 1. Verifica se o user_id está presente (deve ter sido definido pelo AuthMiddleware)
      const userId = req.user?.id;
      if (!userId) {
        throw new CustomError({
          statusCode: 401,
          errorType: 'authenticationError',
          field: 'Token',
          details: [],
          customMessage: this.messages.error.resourceNotFound('Token ou usuário não autenticado')
        });
      }

        /**
         * 2. Determina a rota e o domínio da requisição
         * Remove barras iniciais e finais, remove query strings e pega a primeira parte da URL
         */
        const rotaReq = req.url.split('/').filter(Boolean)[0].split('?')[0];
        const dominioReq = req.hostname || `localhost`; // domínio foi colocado como localhost para fins de teste

        // 3. Busca a rota atual no banco de dados
        const rotaDB = await this.Rota.findOne({ rota: rotaReq, dominio: dominioReq });
        
        if (!rotaDB) {
          throw new CustomError({
            statusCode: 404,
            errorType: 'resourceNotFound',
            field: 'Rota',
            details: [],
            customMessage: this.messages.error.resourceNotFound('Rota')
          });
        }

        // 4. Mapeia o método HTTP para o campo de permissão correspondente
        const metodoMap = {
          'GET': 'buscar',
          'POST': 'enviar',
          'PUT': 'substituir',
          'PATCH': 'modificar',
          'DELETE': 'excluir'
        };

        const metodo = metodoMap[req.method];
        if (!metodo) {
          throw new CustomError({
            statusCode: 405,
            errorType: 'methodNotAllowed',
            field: 'Método',
            details: [],
            customMessage: this.messages.error.resourceNotFound('Método.')
          });
        }

        console.log('Verificando rota:', rotaReq, 'domínio:', dominioReq, 'método:', metodo);

        // 5. Verifica se a rota está ativa
        if (!rotaDB.ativo) {
          throw new CustomError({
            statusCode: 403,
            errorType: 'forbidden',
            field: 'Rota',
            details: [],
            customMessage: this.messages.error.resourceNotFound('Rota.')
          });
        }

        // 6. Verifica se o usuário tem permissão
        const hasPermission = await this.permissionService.hasPermission(
          userId,
          rotaReq.toLowerCase(),
          rotaDB.dominio,
          metodo
        );

        if (!hasPermission) {
          throw new CustomError({
            statusCode: 403,
            errorType: 'forbidden',
            field: 'Permissão',
            details: [],
            customMessage: this.messages.error.resourceNotFound('Permissão')
          });
        }

        req.user = { id: userId };

        next();
      } catch (error) {
        errorHandler(error, req, res, next);
      }
    }
}

// Instanciar e exportar apenas o método 'handle' como função de middleware
export default new AuthPermission().handle;
