import LevantamentoRepository from "../repositories/LevantamentoRepository.js";
import InventarioService from "./InventarioService.js";
import SalaService from "./SalaService.js";
import BemService from "./BemService.js";
import {CustomError, HttpStatusCodes, messages} from "../utils/helpers/index.js";
import minioClient from "../config/minioConnect.js";
import "dotenv/config";

class LevantamentoService {
    constructor() {
        this.repository = new LevantamentoRepository();
        this.inventarioService = new InventarioService();
        this.bemService = new BemService();
        this.salaService = new SalaService();
    }

    async listar(req) {
        console.log("Estou no listar em LevantamentoService");
        const resultado = await this.repository.listar(req);

        if (resultado) {
            await this.gerarUrlsAssinadas(resultado);
        }
        
        return resultado;
    }

    async criar(parsedData) {
        console.log("Estou no criar em LevantamentoService");

        await this.inventarioService.ensureInvExists(parsedData.inventario);
        await this.ensureLevantamentoUnico(parsedData.inventario, parsedData.bemId);
        if (parsedData.salaNova) {
            await this.salaService.ensureSalaExists(parsedData.salaNova);
        }
        const bem = await this.bemService.ensureBemExists(parsedData.bemId);

        const nomeResponsavel = bem.responsavel?.nome || "";
        const cpfResponsavel = bem.responsavel?.cpf || "";

        parsedData.bem = {
            responsavel: {
                nome: nomeResponsavel,
                cpf: cpfResponsavel,
            },
            tombo: bem.tombo,
            nome: bem.nome,
            descricao: bem.descricao,
            salaId: bem.sala,
            id: bem.id,
        };

        return this.repository.criar(parsedData);
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em LevantamentoService");
        const levantamento = await this.ensureLevantamentoExists(id);
        await this.inventarioService.ensureInvExists(levantamento.inventario._id);

        return this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log("Estou no deletar em LevantamentoService");
        await this.ensureLevantamentoExists(id);
        const levantamento = await this.ensureLevantamentoExists(id);
        await this.inventarioService.ensureInvExists(levantamento.inventario._id);

        const deletado = await this.repository.deletar(id);

        deletado.imagem.forEach(async (fileName) => {
            await this.deletarMinio(fileName);
        });

        return deletado;
    }

    async adicionarFoto(id, file) {
        console.log("Estou no adicionarFoto em LevantamentoService");
        const levantamento = await this.ensureLevantamentoExists(id);

        const imagemInfo = await this.enviarMinio(file);

        levantamento.imagem.push(imagemInfo.fileName);

        const resultado = await this.repository.atualizar(id, {
            imagem: levantamento.imagem,
        });

        return await this.gerarUrlsAssinadas(resultado);
    }

    async deletarFoto(id) {
        console.log("Estou no deletarFoto em LevantamentoService");
        const levantamento = await this.ensureLevantamentoExists(id);

        if (levantamento.imagem.length > 0) {
            levantamento.imagem.forEach(async (fileName) => {
                await this.deletarMinio(fileName);
            });
            levantamento.imagem = [];
        } else {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                customMessage: "Nenhuma imagem encontrada no levantamento",
            });
        }

        const resultado = await this.repository.atualizar(id, {
            imagem: levantamento.imagem,
        });

        return resultado;
    }

    // --- MÉTODOS AUXILIARES ---

    async enviarMinio(file) {
        const bucket = process.env.MINIO_BUCKET_FOTOS;
        const targetName = `${Date.now()}-${file.originalname}`;

        const metaData = {
            "Content-Type": file.mimetype,
        };

        const uploaded = await minioClient.putObject(
            bucket,
            targetName,
            file.buffer,
            file.size,
            metaData
        );

        if (!uploaded) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                customMessage: `Erro ao enviar arquivo: ${error.message}`,
            });
        }

        return {
            bucket,
            fileName: targetName,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    async deletarMinio(fileName) {
        const bucket = process.env.MINIO_BUCKET_FOTOS;

        //necessario o uso do try/catch para tratar erros de remoção
        try {
            await minioClient.removeObject(bucket, fileName);
            return true;
        } catch (error) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                customMessage: `Erro ao remover arquivo ${fileName}: ${error.message}`,
            });
        }
    }

    async gerarUrlsAssinadas(doc) {
        if (!doc) return null;

        doc.imagemUrls = [];

        if (doc.imagem && doc.imagem.length > 0) {
            //necessario o uso do try/catch para tratar erros de geração de URLs
            try {
                const bucketName = process.env.MINIO_BUCKET_FOTOS;
                const promises = doc.imagem.map(fileName =>
                    minioClient.presignedGetObject(bucketName, fileName, 3600)
                );
                doc.imagemUrls = await Promise.all(promises);
            } catch (error) {
                console.error(`Falha ao gerar URL para o documento ${doc._id}:`, error);
            }
        }
        return doc;
    }

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

    async ensureLevantamentoUnico(inventarioId, bemId) {
        const levantamentoExistente = await this.repository.buscarPorInventarioEBem(
            inventarioId,
            bemId
        );
        if (levantamentoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                customMessage:
                    "Já existe um levantamento para este bem neste inventário.",
            });
        }
    }
}

export default LevantamentoService;
