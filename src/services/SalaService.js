import SalaRepository from '../repositories/SalaRepository.js';

class SalaService {
    constructor() {
        this.repository = new SalaRepository();
    }

    async listar(req) {
        console.log('Estou no listar em SalaService');
        return await this.repository.listar(req);
    }

    async ensureSalaExists(id) {
        const salaExistente = await this.repository.buscarPorId(id);
        if (!salaExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Sala",
                details: [{
                    path: "id",
                    message: "Sala não encontrado."
                }],
                customMessage: messages.error.resourceNotFound("Sala"),
            });
        }
        return salaExistente;
    }
}

export default SalaService;