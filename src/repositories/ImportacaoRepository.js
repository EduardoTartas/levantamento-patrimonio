import Bem from '../models/Bem.js';
import Sala from '../models/Sala.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class ImportacaoRepository {
    async findSala(nome, bloco, campusId) {
        return await Sala.findOne({
            nome: nome,
            bloco: bloco,
            campus: campusId
        });
    }

    async findSalasByCombinations(combinations, campusId) {
        if (!combinations || combinations.length === 0) {
            return [];
        }

        // Cria uma consulta $or para encontrar qualquer combinação de nome/bloco
        const orQueries = combinations.map(comp => ({
            nome: comp.nome,
            bloco: comp.bloco,
        }));

        // Executa a busca com o campusId e as combinações
        return await Sala.find({
            $and: [
                { campus: campusId },
                { $or: orQueries }
            ]
        });
    }

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

    async verificarTombosDuplicados(tombos) {
        try {
            const tombosValidos = tombos.filter(tombo => tombo && tombo.trim() !== '');
            
            if (tombosValidos.length === 0) {
                return [];
            }
            
            const bensEncontrados = await Bem.find({ 
                tombo: { $in: tombosValidos } 
            }).select('tombo');
            
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

    async insertManyBens(bens, options = {}) {
        try {
            return await Bem.insertMany(bens, options);
        } catch (error) {
            if (error.writeErrors) {
                throw error;
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
