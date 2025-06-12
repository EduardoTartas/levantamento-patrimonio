import Levantamento from '../models/Levantamento.js';
import LevantamentoFilterBuilder from './filters/LevantamentoFilterBuild.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class LevantamentoRepository {
    constructor() {
        this.model = Levantamento;

        if (!Levantamento || typeof Levantamento.paginate !== "function") {
            throw new Error("The Levantamento model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
        }
    }

    async buscarPorId(id) {
        const levantamento = await this.model.findById(id)
            .populate({
                path: 'inventario',
                select: 'nome _id'
            })
            .populate({
                path: 'bem.id',
                select: 'nome tombo responsavel _id'
            })
            .populate({
                path: 'bem.salaID',
                select: 'nome _id'
            })
            .populate({
                path: 'salaNova',
                select: 'nome _id'
            })
            .populate({
                path: 'usuario',
                select: 'nome email _id'
            });

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

    async buscarPorInventarioEBem(inventarioId, bemId) {
        return await this.model.findOne({
            inventario: inventarioId,
            'bem.id': bemId
        });
    }    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            return await this.buscarPorId(id);
        }

        // Parâmetros de paginação e filtros
        const { page, limite, inventario, estado, ocioso, usuario, tombo, nomeBem } = req.query || {};
        const limit = Math.min(parseInt(limite, 10) || 10, 100);

        // Construção do filtro usando o builder
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
                    path: 'bem.id',
                    select: 'nome tombo responsavel _id'
                },
                {
                    path: 'bem.salaID',
                    select: 'nome _id'
                },
                {
                    path: 'salaNova',
                    select: 'nome _id'
                },
                {
                    path: 'usuario',
                    select: 'nome email _id'
                }
            ],
            sort: { createdAt: -1 }, // Ordenado por data de criação, mais recente primeiro
        };

        return await this.model.paginate(filtros, options);
    }

    async criar(parsedData) {
        const levantamento = new this.model(parsedData);
        return await levantamento.save();
    }

    async atualizar(id, parsedData) {
        const levantamento = await this.model
            .findByIdAndUpdate(id, parsedData, { new: true })
            .populate({
                path: 'inventario',
                select: 'nome _id'
            })
            .populate({
                path: 'bem.id',
                select: 'nome tombo responsavel _id'
            })
            .populate({
                path: 'bem.salaID',
                select: 'nome _id'
            })
            .populate({
                path: 'salaNova',
                select: 'nome _id'
            })
            .populate({
                path: 'usuario',
                select: 'nome email _id'
            });

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
