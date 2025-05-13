import Usuario from '../models/Usuario.js';
import UsuarioFilterBuilder from './filters/UsuarioFilterBuilder.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class UsuarioRepository {
    constructor({
        Usuario: UsuarioModel = Usuario,
    } = {}) {
        if (!UsuarioModel || typeof UsuarioModel.paginate !== 'function') {
            throw new Error('The Usuario model must include the paginate method. Ensure mongoose-paginate-v2 is applied.');
        }
        this.model = UsuarioModel;
    }

    async obterParesRotaDominioUnicos(permissoes) {
        const combinacoes = permissoes.map(p => `${p.rota}_${p.dominio || 'undefined'}`);
        const combinacoesUnicas = [...new Set(combinacoes)];
        return combinacoesUnicas.map(combinacao => {
            const [rota, dominio] = combinacao.split('_');
            return { rota, dominio: dominio === 'undefined' ? null : dominio };
        });
    }

    async obterPermissoesDuplicadas(permissoes, combinacoesRecebidas) {
        return permissoes.filter((p, index) =>
            combinacoesRecebidas.indexOf(`${p.rota}_${p.dominio || 'undefined'}`) !== index
        );
    }

    async buscarPorEmail(email, idIgnorado = null) {
        const filtro = { email };

        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }

        const documento = await this.model.findOne(filtro, '+senha')
            // .populate('permissoes') // Comentado
            //.populate('unidades');

        return documento;
    }

    async buscarPorId(id, includeTokens = false) {
        let query = this.model.findById(id);

        if (includeTokens) {
            query = query.select('+refreshtoken +accesstoken');
        }
        const user = await query;
        if (!user) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return user;
    }

    async buscarPorPermissao(permissoes) {
        const query = permissoes.map(p => ({
            rota: p.rota,
            dominio: p.dominio || null
        }));
        const rotasEncontradas = await this.rotaModel.find({ $or: query });
        return rotasEncontradas;
    }

    async listar(req) {
        console.log('Estou no listar em UsuarioRepository');
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id);
            return data;

            // Se um ID for fornecido, retorna o usuário enriquecido com estatísticas


            if (!data) {
                throw new CustomError({
                    statusCode: 404,
                    errorType: 'resourceNotFound',
                    field: 'Usuário',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Usuário')
                });
            }
        }

        const { nome, email, ativo, grupo, unidade, page = 1 } = req.query;
        const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

        const filterBuilder = new UsuarioFilterBuilder()
            .comNome(nome || '')
            .comEmail(email || '')
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

        await filterBuilder.comGrupo(grupo);
        await filterBuilder.comUnidade(unidade);
        const filtros = filterBuilder.build();

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limite, 10),
            populate: [
                // 'permissoes', // Comentado
               // 'unidades'
            ],
            sort: { nome: 1 },
        };

        const resultado = await this.model.paginate(filtros, options);

        resultado.docs = resultado.docs.map(doc => {
            const usuarioObj = typeof doc.toObject === 'function' ? doc.toObject() : doc;

            const totalGrupos = usuarioObj.grupos ? usuarioObj.grupos.length : 0;
            const totalUnidades = usuarioObj.unidades ? usuarioObj.unidades.length : 0;
            const totalPermissoes = usuarioObj.permissoes ? usuarioObj.permissoes.length : 0;

            return {
                ...usuarioObj,
                estatisticas: {
                    totalGrupos,
                    totalUnidades,
                    totalPermissoes
                }
            };
        });

        return resultado;
    }

    async criar(dadosUsuario) {
        const usuario = new this.model(dadosUsuario);
        return await usuario.save();
    }

    async atualizar(id, parsedData) {
        const usuario = await this.model.findByIdAndUpdate(id, parsedData, { new: true })
            .populate([
                // 'permissoes', // Comentado
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
