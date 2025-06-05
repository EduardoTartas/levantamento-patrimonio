import ImportacaoService from '../services/ImportacaoService.js';
import { CommonResponse, CustomError, HttpStatusCodes } from "../utils/helpers/index.js";
import { CampusIdSchema } from '../utils/validators/schemas/zod/querys/CampusQuerySchema.js';
import { fileUploadValidationSchema } from '../utils/validators/schemas/zod/ImportacaoSchema.js';

class ImportacaoController {
    constructor() {
        this.service = ImportacaoService;
    }    async importarCSV(req, res) {
        console.log("Estou no importarCSV em ImportacaoController com validação Zod");
        const { campusId } = req.params || {};
        if (campusId) {
            CampusIdSchema.parse(campusId);
        }
        
        if (!req.file) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST,
                errorType: 'validationError',
                field: 'csvFile',
                details: [],
                customMessage: 'Nenhum arquivo CSV enviado. Por favor, inclua um arquivo.'
            });
        }        fileUploadValidationSchema.parse(req.file);
        
        // Usa o método da instância do serviço para importar o CSV
        const importSummary = await this.service.importCSV(req.file, {
            nome: `Importação ${new Date().toLocaleDateString('pt-BR')}`, // Nome padrão
            campus_id: campusId
        });
        
        // Prepara a resposta com um resumo do resultado da importação
        const responseData = {
            message: `Importação do CSV concluída.`,
            totalRecordsProcessed: importSummary.totalRecordsProcessed,
            totalRecordsInserted: importSummary.totalRecordsInserted,
            totalRecordsSkipped: importSummary.totalRecordsSkipped || 0,
            errorsCount: importSummary.errors.length
        };
        
        // Se houver erros, inclui uma amostra dos erros na resposta (até 10 primeiros)
        if (importSummary.errors.length > 0) {
            responseData.errorSamples = importSummary.errors
                .slice(0, 10)
                .map(err => ({
                    type: err.type,
                    message: err.message,
                    linha: err.linha
                }));
        }
        
        const successMessage = importSummary.errors.length > 0
            ? `Importação concluída com ${importSummary.errors.length} erros. Veja os detalhes na resposta.`
            : 'Importação concluída com sucesso.';
            
        return CommonResponse.created(res, responseData, successMessage);
    }
}

export default ImportacaoController; 