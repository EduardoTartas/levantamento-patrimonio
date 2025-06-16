import SalaFilterBuilder from './filters/SalaFilterBuild.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import Sala from '../models/Sala.js';

class SalaRepository {
    constructor() {
        this.model = Sala;

        if (!Sala || typeof Sala.paginate !== "function") {
            throw new Error("The Bem model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
        }
    }

    async buscarPorId(id) {
        const sala = await this.model.findById(id);

        if (!sala) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Sala',
                details: [],
                customMessage: messages.error.resourceNotFound('Sala'),
            });
        }
        return sala;
    }

    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id)
            .populate({
                path: 'campus',
                select: 'nome _id',
            });

            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Sala',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Sala'),
                });
            }
            
            return data;
        }

        const { nome, campus, bloco, page } = req.query || {};
        const limite = Math.min(parseInt(req.query?.limite, 10) || 10, 100);
        
        const filterBuilder = new SalaFilterBuilder()
            .comNome(nome || "")
            .comCampus(campus || "")
            .comBloco(bloco || "");

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Sala',
                details: [],
                customMessage: messages.error.internalServerError('Sala'),
            });
        }

        const filtros = filterBuilder.build();
        const options = {
            page: parseInt(page, 10) || 1,
            populate:{
                path: 'campus',
                select: 'nome _id',
            },
            limit: limite,
            sort: { nome: 1 },
        };
        
        return await this.model.paginate(filtros, options);
    }
}

export default SalaRepository;