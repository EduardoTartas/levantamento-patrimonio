import Bem from '../models/Bem.js';
import Sala from '../models/Sala.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class ImportacaoRepository {
    /**
     * Busca uma sala existente por nome, bloco e campus
     * @param {string} nome - Nome da sala
     * @param {string} bloco - Bloco da sala
     * @param {string} campusId - ID do campus
     * @returns {Promise<object|null>} Sala encontrada ou null
     */
    async findSala(nome, bloco, campusId) {
        return await Sala.findOne({
            nome: nome,
            bloco: bloco,
            campus: campusId
        });
    }

    /**
     * Cria uma nova sala no banco de dados
     * @param {string} nome - Nome da sala
     * @param {string} bloco - Bloco da sala
     * @param {string} campusId - ID do campus
     * @returns {Promise<object>} Sala criada
     */
    async createSala(nome, bloco, campusId) {
        try {
            const novaSala = new Sala({
                nome,
                bloco,
                campus: campusId
            });
            return await novaSala.save();
        } catch (error) {
            console.error('[REPO ERROR] Erro ao criar sala:', error.message);
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Sala',
                details: [{ message: error.message }],
                customMessage: messages.error.internalServerError('Sala')
            });
        }
    }

    /**
     * Verifica se existem bens com os mesmos tombos
     * @param {Array<string>} tombos - Array de números de tombamento para verificar
     * @returns {Promise<Array<string>>} Tombos que já existem no banco de dados
     */
    async verificarTombosDuplicados(tombos) {
        try {
            // Filtra tombos não vazios
            const tombosValidos = tombos.filter(tombo => tombo && tombo.trim() !== '');
            
            if (tombosValidos.length === 0) {
                return [];
            }
            
            // Busca bens com os tombos informados
            const bensEncontrados = await Bem.find({ 
                tombo: { $in: tombosValidos } 
            }).select('tombo');
            
            // Retorna apenas os tombos encontrados
            return bensEncontrados.map(bem => bem.tombo);
        } catch (error) {
            console.error('[REPO ERROR] Erro ao verificar tombos duplicados:', error.message);
            throw new CustomError({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Bem',
                details: [{ message: error.message }],
                customMessage: messages.error.internalServerError('Verificação de tombos')
            });
        }
    }

    /**
     * Insere múltiplos bens no banco de dados
     * @param {Array<object>} bens - Array de objetos bem
     * @param {object} options - Opções de inserção
     * @returns {Promise<object>} Resultado da operação
     */
    async insertManyBens(bens, options = {}) {
        try {
            return await Bem.insertMany(bens, options);
        } catch (error) {
            // Se tiver writeErrors, significa que alguns documentos foram inseridos com sucesso
            if (error.writeErrors) {
                throw error; // Mantém o erro original com writeErrors
            } else {
                console.error('[REPO ERROR] Erro ao inserir bens em lote:', error.message);
                throw new CustomError({
                    statusCode: 500,
                    errorType: 'internalServerError',
                    field: 'Bem',
                    details: [{ message: error.message }],
                    customMessage: messages.error.internalServerError('Bem')
                });
            }
        }
    }
}

export default new ImportacaoRepository();
