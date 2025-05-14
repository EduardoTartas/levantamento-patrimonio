import Usuario from '../models/Usuario.js';
import UsuarioFilterBuilder from './filters/UsuarioFilterBuilder.js';
import {
    CustomError,
    messages
} from '../utils/helpers/index.js';

class UsuarioRepository {
    constructor({
        Usuario: UsuarioModel = Usuario,
    } = {}) {
        if (!UsuarioModel || typeof UsuarioModel.paginate !== 'function') {
            throw new Error('The Usuario model must include the paginate method. Ensure mongoose-paginate-v2 is applied.');
        }
        this.model = UsuarioModel;
    }

    async listar(req) {
        console.log('Estou no listar em UsuarioRepository');
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id);

            // Se um ID for fornecido, retorna o usuário

            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Usuário',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Usuário')
                });
            }

            return data;
        }
        const {nome, ativo, page} = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filterBuilder = new UsuarioFilterBuilder()
            .comNome(nome || '')
            .comAtivo(ativo || '');

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.internalServerError('Usuário')
            });
        }

        const filtros = filterBuilder.build();

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limite, 10),
            sort: {
                nome: 1
            },
        };

        const resultado = await this.model.paginate(filtros, options);

        return resultado;
    }

    async criar(dadosUsuario) {
        const usuario = new this.model(dadosUsuario);
        return await usuario.save();
    }

    async atualizar(id, parsedData) {
        const usuario = await this.model.findByIdAndUpdate(id, parsedData, {
                new: true
            })
            .populate([
                //ver populadores
                //'campus',
                // 'permissoes',
                //'unidades'
            ])
            .exec();

        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }

    async deletar(id) {
        const usuario = await this.model.findByIdAndDelete(id);
        return usuario;
    }
}

export default UsuarioRepository;