import RelatorioService from '../services/RelatorioService.js';
import { CommonResponse } from '../utils/helpers/index.js';

class RelatorioController {
    constructor() {
        this.service = new RelatorioService();
    }

    async gerar(req, res) {
        try {
            const pdfBuffer = await this.service.gerarRelatorio(req.query);
    
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
    
            return res.send(pdfBuffer);
        } catch (error) {
            return CommonResponse.error(res, error)
        }
    }
}

export default RelatorioController;