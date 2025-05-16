import CampusFilterBuilder from './filters/CampusFilterBuilder.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import Campus from '../models/Campus.js';
import Usuario from '../models/Usuario.js';

class CampusRepository {
    constructor() {
        this.model = Campus;
        if (!Campus || typeof Campus.paginate !== "function") {
            throw new Error("The Campus model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
        }
    }
    
    async buscarPorNome(nome, cidade = null, idDiferente = null) {
        const filtro = { nome };
        
        if (idDiferente) {
            filtro._id = { $ne: idDiferente };
        }
        
        if (cidade) {
            filtro.cidade = cidade;
        }
        
        return await this.model.findOne(filtro);
    }

    async buscarPorId(id) {
        const campus = await this.model.findById(id);
        
        if (!campus) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Unidade',
                details: [],
                customMessage: messages.error.resourceNotFound('Unidade')
            });
        }
        
        return campus;
    }

    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id);

            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Unidade',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Unidade'),
                });
            }
            
            return data;
        }

        const { nome, cidade, ativo = true, page } = req.query || {};
        const limite = Math.min(parseInt(req.query?.limite, 10) || 10, 100);
        
        const filterBuilder = new CampusFilterBuilder()
            .comNome(nome || "")
            .comCidade(cidade || "")
            .comAtivo(ativo || "");

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Unidade',
                details: [],
                customMessage: messages.error.internalServerError('Unidade'),
            });
        }

        const filtros = filterBuilder.build();
        const options = {
            page: parseInt(page, 10) || 1,
            limit: limite,
            sort: { nome: 1 },
        };
        
        return await this.model.paginate(filtros, options);
    }

    async criar(dadosUnidade) {
        const unidade = new this.model(dadosUnidade);
        return await unidade.save();
    }

    async atualizar(id, dadosAtualizados) {
        const campus = await this.model.findByIdAndUpdate(id, dadosAtualizados, { new: true });

        if (!campus) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Campus',
                details: [],
                customMessage: messages.error.resourceNotFound('Campus'),
            });
        }
        
        return campus;
    }

    async deletar(id) {
        const campusDeletado = await this.model.findByIdAndDelete(id);

        if (!campusDeletado) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Campus',
                details: [],
                customMessage: messages.error.resourceNotFound('Campus')
            });
        }
        
        return campusDeletado;      
    }

    async verificarUsuariosAssociados(id) {
        return await Usuario.findOne({ campus: id });
    }
}

export default CampusRepository;
