import Levantamento from '../models/Levantamento.js';
import LevantamentoFilterBuilder from './filters/LevantamentoFilterBuild.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import minioClient from '../config/minioConnect.js';
import 'dotenv/config';

async function _gerarUrlsAssinadas(doc) { 
    if (!doc || !doc.imagem || doc.imagem.length === 0) {
        if (doc) doc.imagemUrls = [];
        return doc;
    }

    const bucketName = process.env.MINIO_BUCKET_FOTOS;
    const promises = doc.imagem.map(fileName =>
        minioClient.presignedGetObject(bucketName, fileName, 3600)
    );
    
    doc.imagemUrls = await Promise.all(promises).catch(() => {
        throw new CustomError({
            statusCode: 500,
            errorType: 'internalServerError',
            field: 'Levantamento',
            customMessage: messages.error.internalServerError('Erro ao gerar URLs de imagens'),
        });
    });

    return doc;
}


class LevantamentoRepository {
    constructor() {
        this.model = Levantamento;

        if (!Levantamento || typeof Levantamento.paginate !== "function") {
            throw new Error("The Levantamento model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
        }
    }

    async buscarPorId(id) {
        // CORREÇÃO: Adicionando as chamadas .populate() que estavam faltando
        const levantamento = await this.model.findById(id)
            .populate([
                { path: 'inventario', select: 'nome _id' },
                { path: 'salaNova', select: 'nome _id' },
                { path: 'usuario', select: 'nome cpf _id' }
            ])
            .lean(); // .lean() continua sendo importante

        if (!levantamento) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Levantamento',
                customMessage: messages.error.resourceNotFound('Levantamento'),
            });
        }
        return _gerarUrlsAssinadas(levantamento);
    }

    async buscarPorInventarioEBem(inventarioId, bemId) {
        return await this.model.findOne({
            inventario: inventarioId,
            'bem.id': bemId
        });
    }    
    
    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            return await this.buscarPorId(id);
        }

        const { page, limite, inventario, estado, ocioso, usuario, tombo, nomeBem } = req.query || {};
        const limit = Math.min(parseInt(limite, 10) || 10, 100);

        const filterBuilder = new LevantamentoFilterBuilder()
            .comInventario(inventario || "")
            .comEstado(estado || "")
            .comOcioso(ocioso)
            .comUsuario(usuario || "")
            .comTombo(tombo || "")
            .comNomeBem(nomeBem || "");

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Levantamento',
                details: [],
                customMessage: messages.error.internalServerError('Levantamento'),
            });
        }

        const filtros = filterBuilder.build();

        const options = {
            page: parseInt(page, 10) || 1,
            limit: limit,            
            populate: [
            {
                path: 'inventario',
                select: 'nome _id'
            },
            {
                path: 'bem',
                select: 'nome tombo _id'
            },
            {
                path: 'salaNova',
                select: 'nome _id'
            },
            {
                path: 'usuario',
                select: 'nome cpf _id'
            }
            ],
            sort: { createdAt: -1 },
        };

       const result = await this.model.paginate(filtros, options);

        // Mapeia os resultados para adicionar as URLs
        result.docs = await Promise.all(result.docs.map(_gerarUrlsAssinadas));
        return result;
    }

    async criar(parsedData) {
        const levantamento = new this.model(parsedData);
        return await levantamento.save();
    }

    async atualizar(id, parsedData) {
        const levantamento = await this.model
            .findByIdAndUpdate(id, parsedData, { new: true })
            .populate([
                {
                    path: 'inventario',
                    select: 'nome _id'
                },
                {
                    path: 'bem',
                    select: 'nome tombo _id'
                },
                {
                    path: 'salaNova',
                    select: 'nome _id'
                },
                {
                    path: 'usuario',
                    select: 'nome cpf _id'
                }
            ]);

        if (!levantamento) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Levantamento',
                details: [],
                customMessage: messages.error.resourceNotFound('Levantamento'),
            });
        }

        return levantamento;
    }

    async deletar(id) {
        return await this.model.findByIdAndDelete(id);
    }
}

export default LevantamentoRepository;
