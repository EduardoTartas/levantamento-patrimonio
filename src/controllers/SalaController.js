import SalaService from '../services/SalaService.js';
import { CommonResponse, CustomError, HttpStatusCodes} from '../utils/helpers/index.js';
import { SalaQuerySchema, SalaIdSchema } from '../utils/validators/schemas/zod/querys/SalaQuerySchema.js';

class SalaController {
    constructor() {
        this.service = new SalaService();
    }

    async listar(req, res) {
        console.log('Estou no listar em SalaController, enviando req para SalaService');
        const { id } = req.params || {};
        if (id) {
            SalaIdSchema.parse(id);
        }

        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await SalaQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }
}

export default SalaController;