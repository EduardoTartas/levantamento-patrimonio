import re from 'node:util';
import ImportacaoRepository from '../repositories/ImportacaoRepository.js';
import { CustomError, HttpStatusCodes, messages } from '../utils/helpers/index.js';

class ImportacaoService {
    constructor() {
        this.repository = ImportacaoRepository;
    }

    /**
     * Extrai o nome da sala e o bloco de uma string de localização.
     * @param {string} localizacaoRaw - A string de localização completa, ex: "NOME DA SALA (BLOCO)".
     * @returns {{nome: string, bloco: string}} Objeto com nome e bloco da sala.
     */
    _extractSalaInfo(localizacaoRaw) {
        if (!localizacaoRaw) {
            return { nome: 'Não Localizado', bloco: 'Não Especificado' };
        }

        const match = localizacaoRaw.match(/(.*)\s+\(([^)]+)\)$/);
        if (match) {
            return {
                nome: match[1].trim(),
                bloco: match[2].trim()
            };
        }

        return { nome: localizacaoRaw, bloco: 'Não Especificado' };
    }

    /**
     * Analisa o conteúdo do arquivo com delimitadores personalizados '£' e '¥'.
     * @param {Buffer} buffer - O buffer do arquivo enviado.
     * @returns {Array<object>} Um array de registros de bens extraídos.
     */
    _parseCSV(buffer) {
        const content = buffer.toString('utf-8');
        const lines = content.split('£').filter(line => line.trim().startsWith('D¥¥'));
        
        return lines.map((line, index) => {
            const fields = line.trim().split('¥');
            // Mapeia os campos com base na estrutura do arquivo
            return {
                linha: index + 1,
                descricaoCompleta: fields[2] || '',
                localizacao: fields[4] || '',
                valor: fields[10] || '0',
                tombo: fields[15] || '',
                responsavel: fields[23] || 'Não especificado'
            };
        });
    }

    /**
     * Orquestra a importação de bens a partir de um arquivo CSV.
     * @param {object} file - O objeto do arquivo enviado pelo multer.
     * @param {object} options - Opções adicionais, como o campus_id.
     * @returns {Promise<object>} Um resumo da operação de importação.
     */
    async importCSV(file, options) {
        const { campus_id } = options;
        if (!campus_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST,
                errorType: 'validationError',
                customMessage: 'O ID do campus é obrigatório para a importação.'
            });
        }

        const summary = {
            totalRecordsProcessed: 0,
            totalRecordsInserted: 0,
            totalRecordsSkipped: 0,
            errors: []
        };
        
        const registros = this._parseCSV(file.buffer);
        summary.totalRecordsProcessed = registros.length;

        if (registros.length === 0) {
            return summary;
        }

        // 1. Verificar todos os tombos de uma só vez
        const tombosParaVerificar = registros.map(r => r.tombo).filter(t => t);
        const tombosDuplicados = new Set(await this.repository.verificarTombosDuplicados(tombosParaVerificar));

        const bensParaInserir = [];
        const salasCache = new Map();

        // 2. Processar cada registro em memória
        for (const registro of registros) {
            // Pula registros com tombos duplicados
            if (registro.tombo && tombosDuplicados.has(registro.tombo)) {
                summary.totalRecordsSkipped++;
                summary.errors.push({
                    type: 'Duplicado',
                    message: `O bem com o tombo '${registro.tombo}' já existe no sistema.`,
                    linha: registro.linha
                });
                continue;
            }

            // Obter ou criar a sala
            let sala;
            const { nome: nomeSala, bloco: blocoSala } = this._extractSalaInfo(registro.localizacao);
            const cacheKey = `${nomeSala}|${blocoSala}`;

            if (salasCache.has(cacheKey)) {
                sala = salasCache.get(cacheKey);
            } else {
                sala = await this.repository.findSala(nomeSala, blocoSala, campus_id);
                if (!sala) {
                    sala = await this.repository.createSala(nomeSala, blocoSala, campus_id);
                }
                salasCache.set(cacheKey, sala);
            }
            
            // Montar o objeto do bem para inserção
            const nomeBem = registro.descricaoCompleta.split('.')[0] || 'Item sem descrição';
            
            bensParaInserir.push({
                sala: sala._id,
                nome: nomeBem,
                tombo: registro.tombo,
                responsavel: registro.responsavel,
                descricao: registro.descricaoCompleta,
                valor: parseFloat(registro.valor) / 100.0,
                ocioso: registro.localizacao.toUpperCase().includes('BENS RECOLHIDOS'),
                auditado: false,
            });
        }

        // 3. Inserir todos os bens válidos de uma só vez
        if (bensParaInserir.length > 0) {
            try {
                const result = await this.repository.insertManyBens(bensParaInserir, { ordered: false });
                summary.totalRecordsInserted = result.length;
            } catch (error) {
                // Trata erros de inserção em lote (ex: falhas de validação)
                summary.totalRecordsInserted = error.result?.nInserted || 0;
                const writeErrors = error.writeErrors || [];
                
                writeErrors.forEach(err => {
                    const failedDoc = err.op; // Documento que falhou
                    summary.errors.push({
                        type: 'Erro de Inserção',
                        message: `Falha ao inserir bem '${failedDoc.nome}' (Tombo: ${failedDoc.tombo}). Motivo: ${err.errmsg}`,
                        linha: 'N/A' // A linha original se perde na inserção em lote, mas o tombo ajuda a identificar
                    });
                });
            }
        }
        
        summary.totalRecordsSkipped = summary.totalRecordsProcessed - summary.totalRecordsInserted;

        return summary;
    }
}

// CORREÇÃO: Exporte uma instância da classe, não a classe em si.
export default new ImportacaoService();
