import BemFilterBuilder from './filters/BemFilterBuild.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import Bem from '../models/Bem.js';

class BemRepository {
    constructor() {
        this.model = Bem;

        if (!Bem || typeof Bem.paginate !== "function") {
            throw new Error("The Bem model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
        }
    }

    async buscarPorId(id) {
        const bem = await this.model.findById(id);

        if (!bem) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Bem',
                details: [],
                customMessage: messages.error.resourceNotFound('Bem'),
            });
        }
        return bem;
    }

    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id)
            .populate({
                path: 'sala',
                select: 'nome _id',
            });

            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Bem',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Bem'),
                });
            }
            
            return data;
        }

        const { nome, tombo, responsavel, auditado = false, sala, page } = req.query || {};
        const limite = Math.min(parseInt(req.query?.limite, 10) || 10, 100);
        
        const filterBuilder = new BemFilterBuilder()
            .comNome(nome || "")
            .comTombo(tombo || "")
            .comResponsavel(responsavel || "")
            .comSala(sala || "")
            .comAuditado(auditado);

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Bem',
                details: [],
                customMessage: messages.error.internalServerError('Bem'),
            });
        }

        const filtros = filterBuilder.build();
        const options = {
            page: parseInt(page, 10) || 1,
            populate:{
                path: 'sala',
                select: 'nome _id',
            },
            limit: limite,
            sort: { nome: 1 },
        };
        
        return await this.model.paginate(filtros, options);
    }
}

export default BemRepository;