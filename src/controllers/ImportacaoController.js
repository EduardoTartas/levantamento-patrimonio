import ImportacaoService from "../services/ImportacaoService.js";
import {CommonResponse, CustomError, HttpStatusCodes} from "../utils/helpers/index.js";
import { CampusIdSchema } from "../utils/validators/schemas/zod/querys/CampusQuerySchema.js";
import { fileUploadValidationSchema } from "../utils/validators/schemas/zod/ImportacaoSchema.js";

class ImportacaoController {
  constructor() {
    this.service = ImportacaoService;
  }

  async importarCSV(req, res) {
    console.log(
      "Estou no importarCSV em ImportacaoController com validação Zod"
    );
    // Validação do ID do campus
    const { campusId } = req.params || {};
    if (campusId) {
      CampusIdSchema.parse(campusId);
    }

    // Validação do arquivo
    if (!req.file) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: "validationError",
        field: "csvFile",
        customMessage:
          "Nenhum arquivo CSV enviado. Por favor, inclua um arquivo.",
      });
    }
    fileUploadValidationSchema.parse(req.file);

    console.log("antes de chmar service");

    const importSummary = await this.service.importCSV(req.file, {
      nome: req.file.originalname,
      campus_id: campusId,
    });

    const responseData = {
      message: `Importação do arquivo '${req.file.originalname}' concluída.`,
      totalRecordsProcessed: importSummary.totalRecordsProcessed,
      totalRecordsInserted: importSummary.totalRecordsInserted,
      totalRecordsSkipped: importSummary.totalRecordsSkipped,
      errorsCount: importSummary.errors.length,
      errorSamples: [],
    };

    if (importSummary.errors.length > 0) {
      responseData.errorSamples = importSummary.errors
        .slice(0, 10) //10 amostras
        .map((err) => ({
          type: err.type,
          message: err.message,
          linha: err.linha,
        }));
    }

    const successMessage =
      importSummary.errors.length > 0
        ? `Importação concluída com ${importSummary.errors.length} erros. Veja os detalhes na resposta.`
        : "Importação concluída com sucesso.";

    return CommonResponse.created(res, responseData, successMessage);
  }
}

export default ImportacaoController;
