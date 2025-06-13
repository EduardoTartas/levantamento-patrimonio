import LevantamentoRepository from "../repositories/LevantamentoRepository.js";
import InventarioService from "./InventarioService.js";
import BemService from "./BemService.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import { parse } from "path";

class LevantamentoService {
    constructor() {
        this.repository = new LevantamentoRepository();
        this.inventarioService = new InventarioService();
        this.bemService = new BemService();
    }

    async listar(req) {
        console.log("Estou no listar em LevantamentoService");
        return this.repository.listar(req);
    }

    async criar(parsedData) {

        console.log("Estou no criar em LevantamentoService");

        await this.inventarioService.ensureInvExists(parsedData.inventario);
        await this.ensureLevantamentoUnico(parsedData.inventario, parsedData.bemId);
         //ESPERAR ROTA SALA SER IMPLEMENTADA
        /*
         if(parsedData.salaNova){
            await this.salaService.ensureSalaExists(parsedData.salaNova);
         }*/
        const bem = await this.bemService.ensureBemExists(parsedData.bemId);
        
        const nomeResponsavel = bem.responsavel?.nome || '';
        const cpfResponsavel = bem.responsavel?.cpf || '';

        parsedData.bem = {
            responsavel:{
                nome: nomeResponsavel,
                cpf: cpfResponsavel
            },
            tombo: bem.tombo,
            nome: bem.nome,
            descricao: bem.descricao,
            salaId: bem.sala,
            id: bem.id
        };
       
        return this.repository.criar(parsedData);
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em LevantamentoService");
        await this.ensureLevantamentoExists(id);

        return this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log("Estou no deletar em LevantamentoService");
        await this.ensureLevantamentoExists(id);
        return this.repository.deletar(id);
    }
    
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