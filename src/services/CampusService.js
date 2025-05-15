import CampusRepository from '../repositories/CampusRepository.js';
import { CustomError,HttpStatusCodes, messages } from '../utils/helpers/index.js';

class CampusService {
    constructor() {
        this.repository = new CampusRepository();
    }

    async listar(req) {
        console.log('Estou no listar em CampusService');
        return await this.repository.listar(req);
    }

    async criar(parsedData) {
        console.log('Estou no criar em CampusService');
        
        await this.validateNomeCidade(parsedData.nome, parsedData.cidade);
        return await this.repository.criar(parsedData);
    }

    async atualizar(id, parsedData) {
        console.log('Estou no atualizar em UnidadeService');

        await this.validateNomeCidade(parsedData.nome, parsedData.cidade, id);
        await this.ensureExists(id);

        return await this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log('Estou no deletar em CampusService');

        await this.ensureExists(id);
        const usuariosAssociados = await this.repository.verificarUsuariosAssociados(id);

        if (usuariosAssociados) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'resourceConflict',
                field: 'Grupo',
                details: [],
                customMessage: messages.error.resourceConflict('Usuários associados'),
            });
        }

        return await this.repository.deletar(id);
    }

    async validateNomeCidade(nome, cidade, id = null) {
        const campusExistente = await this.repository.buscarPorNome(nome, cidade, id);
        if (campusExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "validationError",
                field: "nome",
                details: [{
                    path: "nome",
                    message: "Campus com este nome e cidade já existe."
                }],
                customMessage: "Campus com este nome e cidade já existe.",
            });
        }
    }

    async ensureExists(id) {
        const campusExistente = await this.repository.buscarPorId(id);
        if (!campusExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Campus',
                details: [],
                customMessage: messages.error.resourceNotFound('Campus'),
            });
        }
    }
}

export default CampusService;
