import InventarioRepository from "../repositories/InventarioRepository.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import CampusService from "./CampusService.js";

class InventarioService {
    constructor() {
        this.repository = new InventarioRepository();
        this.campusService = new CampusService();
    }

    async listar(req) {
        console.log("Estou no listar em InventarioService");
        return this.repository.listar(req);
    }

    async criar(parsedData) {
        console.log("Estou no criar em InventarioService");

        await this.campusService.ensureCampExists(parsedData.campus);

        console.log(`Estou processando o schema em InventarioService ${parsedData}`);
        return this.repository.criar(parsedData);
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em InventarioService");

        await this.ensureInvExists(id); 
        if (parsedData.campus) {
            await this.campusService.ensureCampExists(parsedData.campus);
        }
    
        return this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log("Estou no deletar em InventarioService");

        await this.ensureInvExists(id);
        
        return this.repository.deletar(id);
    }

    // Métodos auxiliares
    
    async ensureInvExists(id) {
        const inventarioExistente = await this.repository.buscarPorId(id);
        if (!inventarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Inventário",
                details: [{
                    path: "id",
                    message: "Inventário não encontrado."
                }],
                customMessage: messages.error.resourceNotFound("Inventário"),
            });
        }
        return inventarioExistente;
    }
}

export default InventarioService;