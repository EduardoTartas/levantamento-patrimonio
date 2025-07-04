import RelatorioService from '../services/RelatorioService.js';
import { CommonResponse } from '../utils/helpers/index.js';
import { RelatorioQuerySchema } from '../utils/validators/schemas/zod/querys/RelatorioQuerySchema.js';

class RelatorioController {
    constructor() {
        this.service = new RelatorioService();
    }

    async gerar(req, res) {
        
            const query = req.query || {};
                if (Object.keys(query).length !== 0) {
                  await RelatorioQuerySchema.parseAsync(query);
                }

            const pdfBuffer = await this.service.gerarRelatorio(req.query);
    
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
    
            return res.send(pdfBuffer);
    }
}

export default RelatorioController;