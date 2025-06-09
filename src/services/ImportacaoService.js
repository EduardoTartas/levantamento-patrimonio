import ImportacaoRepository from '../repositories/ImportacaoRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class ImportacaoService {
    constructor() {
        this.repository = ImportacaoRepository;
    }

    _extractSalaInfo(localizacaoRaw) {
        if (!localizacaoRaw) {
            return { nome: 'Não Localizado', bloco: 'Não Especificado' };
        }
        const match = localizacaoRaw.match(/(.*)\s+\(([^)]+)\)$/);
        if (match) {
            return { nome: match[1].trim(), bloco: match[2].trim() };
        }
        return { nome: localizacaoRaw, bloco: 'Não Especificado' };
    }
    
    _parseCSV(buffer) {
        const content = buffer.toString('utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim().startsWith('D¥¥'));

        return lines.map((line, index) => {
            const dataPart = line.split('£')[0];
            const fields = dataPart.split('¥');

            if (fields.length < 25) return null;

            const len = fields.length;
            
            return {
                linha: index + 1,
                descricaoCompleta: fields[2] || '',
                localizacao: fields[4] || '',
                valor: fields[10] || '0',
                tombo: fields[15] || '',
                cpfResponsavel: fields[len - 7] || '',
                nomeResponsavel: fields[len - 6] || 'Responsável não informado',
            };
        }).filter(Boolean);
    }

    async importCSV(file, options) {
        const { campus_id } = options;
        if (!campus_id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST,
                errorType: 'validationError',
                customMessage: 'O ID do campus é obrigatório para a importação.',
            });
        }

        const registros = this._parseCSV(file.buffer);
        
        const failureStats = {
            'Tombos duplicados': 0,
            'Falhas de inserção no banco': 0,
        };

        const summary = {
            totalRecordsProcessed: registros.length,
            totalRecordsInserted: 0,
            totalRecordsSkipped: 0,
            errors: [],
        };

        if (registros.length === 0) {
            return summary;
        }

        const uniqueSalaCombinations = [...new Map(
            registros.map(r => this._extractSalaInfo(r.localizacao))
                     .map(salaInfo => [`${salaInfo.nome}|${salaInfo.bloco}`, salaInfo])
        ).values()];

        const salasExistentes = await this.repository.findSalasByCombinations(uniqueSalaCombinations, campus_id);

        const salasCache = new Map();
        salasExistentes.forEach(sala => {
            const cacheKey = `${sala.nome}|${sala.bloco}`;
            salasCache.set(cacheKey, sala);
        });

        const tombosParaVerificar = registros.map(r => r.tombo).filter(Boolean);
        const tombosDuplicadosNoDB = new Set(await this.repository.verificarTombosDuplicados(tombosParaVerificar));

        const bensParaInserir = [];

        for (const registro of registros) {
            if (registro.tombo && tombosDuplicadosNoDB.has(registro.tombo)) {
                failureStats['Tombos duplicados']++;
                continue;
            }

            let nomeResponsavelLimpo = registro.nomeResponsavel.trim();
            if (!nomeResponsavelLimpo || nomeResponsavelLimpo === 'FALSE') {
                nomeResponsavelLimpo = 'Responsável não informado';
            }

            const { nome: nomeSala, bloco: blocoSala } = this._extractSalaInfo(registro.localizacao);
            const cacheKey = `${nomeSala}|${blocoSala}`;
            let sala = salasCache.get(cacheKey);

            if (!sala) {
                sala = await this.repository.createSala(nomeSala, blocoSala, campus_id);
                salasCache.set(cacheKey, sala); 
            }
            
            const nomeBem = registro.descricaoCompleta.split('.')[0] || 'Item sem descrição';
            
            bensParaInserir.push({
                sala: sala._id,
                nome: nomeBem,
                tombo: registro.tombo,
                responsavel: {
                    nome: nomeResponsavelLimpo,
                    cpf: registro.cpfResponsavel.trim(),
                },
                descricao: registro.descricaoCompleta,
                valor: parseFloat(registro.valor) / 100.0,
                ocioso: registro.localizacao.toUpperCase().includes('BENS RECOLHIDOS'),
                auditado: false,
            });
        }

        if (bensParaInserir.length > 0) {
            try {
                const result = await this.repository.insertManyBens(bensParaInserir, { ordered: false });
                summary.totalRecordsInserted = result.length;
            } catch (error) {
                summary.totalRecordsInserted = error.result?.nInserted || 0;
                const writeErrors = error.writeErrors || [];
                
                failureStats['Falhas de inserção no banco'] = writeErrors.length;
                writeErrors.forEach(err => {
                    const failedDoc = err.op;
                    summary.errors.push({
                        type: 'Erro de Inserção no Banco',
                        message: `Falha ao inserir bem (Tombo: ${failedDoc.tombo}). Motivo: ${err.errmsg}`,
                        linha: 'N/A',
                    });
                });
            }
        }

        summary.totalRecordsSkipped = Object.values(failureStats).reduce((a, b) => a + b, 0);
        summary.errorsCount = summary.errors.length;

        console.log('\n--- Detalhamento da Importação ---');
        for (const [reason, count] of Object.entries(failureStats)) {
            if (count > 0) {
                console.log(`- ${count.toLocaleString('pt-BR')} registros pulados por: ${reason}`);
            }
        }
        console.log('------------------------------------\n');

        return summary;
    }
}

export default new ImportacaoService();
