import LevantamentoRepository from "../repositories/LevantamentoRepository.js";
import InventarioService from "./InventarioService.js"; // Dependência para validar o inventário
import BemService from "./BemService.js"; // Dependência para validar o bem
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";

class LevantamentoService {
    constructor() {
        this.repository = new LevantamentoRepository();
        this.inventarioService = new InventarioService(); // Instancia o serviço de inventário
        this.bemService = new BemService(); // Instancia o serviço de bem
    }

    async listar(req) {
        console.log("Estou no listar em LevantamentoService");
        return this.repository.listar(req);
    }

    async criar(parsedData) {

        console.log("Estou no criar em LevantamentoService");

        await this.inventarioService.ensureInvExists(parsedData.inventario);
        await this.bemService.ensureBemExists(parsedData.bemId);
        //pegar o usuatio do token JWT e adicionar ao parsedData
        
        
        await this.ensureLevantamentoUnico(parsedData.inventario, parsedData.bemId);
        
        // Adicionar outros dados que o service é responsável por popular, como o usuário que fez a ação.
        // Ex: parsedData.usuario = req.user.id; (o ID do usuário viria do token JWT)

        return this.repository.criar(parsedData);
    }

    /**
     * Garante que o levantamento existe e atualiza seus dados.
     */
    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em LevantamentoService");

        // 1. Garante que o levantamento que se deseja atualizar realmente existe
        await this.ensureLevantamentoExists(id);

        // 2. Se um novo bem ou inventário for fornecido, valida se eles existem
        if (parsedData.inventario) {
            await this.inventarioService.ensureInventarioExists(parsedData.inventario);
        }
        if (parsedData.bemId) {
            await this.bemService.ensureBemExists(parsedData.bemId);
        }

        return this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log("Estou no deletar em LevantamentoService");
        await this.ensureLevantamentoExists(id);
        return this.repository.deletar(id);
    }
    
    /**
     * Adiciona uma foto a um levantamento existente.
     */
    async adicionarFoto(id, file) {
        console.log("Estou no adicionarFoto em LevantamentoService");
        await this.ensureLevantamentoExists(id);

        // Lógica de negócio para tratar o arquivo:
        // Ex: fazer upload para um serviço de nuvem (AWS S3, Google Cloud Storage, etc.)
        // e obter a URL final.
        // Por enquanto, vamos simular que a URL é o caminho do arquivo.
        const imageUrl = file.path; // Em produção, seria a URL do serviço de armazenamento

        // Atualiza o levantamento com o caminho da imagem
        const dataToUpdate = { imagem: imageUrl };
        
        return this.repository.atualizar(id, dataToUpdate);
    }

    // --- MÉTODOS AUXILIARES ---

    /**
     * Garante que um levantamento com o ID fornecido exista no banco de dados.
     * Caso não exista, lança um erro.
     */
    async ensureLevantamentoExists(id) {
        const levantamentoExistente = await this.repository.buscarPorId(id);
        if (!levantamentoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                customMessage: messages.error.resourceNotFound("Levantamento"),
            });
        }
        return levantamentoExistente;
    }
    
    /**
     * Garante que não há um levantamento duplicado para o mesmo bem no mesmo inventário.
     */
    async ensureLevantamentoUnico(inventarioId, bemId) {
        const levantamentoExistente = await this.repository.buscarPorInventarioEBem(inventarioId, bemId);
        if (levantamentoExistente) {
             throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                customMessage: "Já existe um levantamento para este bem neste inventário.",
            });
        }
    }
}

export default LevantamentoService;