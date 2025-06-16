import BemRepository from '../repositories/BemRepository.js';

class BemService {
    constructor() {
        this.repository = new BemRepository();
    }

    async listar(req) {
        console.log('Estou no listar em BemService');
        return await this.repository.listar(req);
    }

    async ensureBemExists(id) {
        const bemExistente = await this.repository.buscarPorId(id);
        if (!bemExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Bem",
                details: [{
                    path: "id",
                    message: "Bem não encontrado."
                }],
                customMessage: messages.error.resourceNotFound("Bem"),
            });
        }
        return bemExistente;
    }
}

export default BemService;