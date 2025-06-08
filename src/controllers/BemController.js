import BemService from '../services/BemService.js';
import { CommonResponse, CustomError, HttpStatusCodes} from '../utils/helpers/index.js';
import { BemQuerySchema, BemIdSchema } from '../utils/validators/schemas/zod/querys/BemQuerySchema.js';
import { BemSchema} from '../utils/validators/schemas/zod/BemSchema.js';

class BemController {
    constructor() {
        this.service = new BemService();
    }

    async listar(req, res) {
        console.log('Estou no listar em BemController, enviando req para BemService');

        const { id } = req.params || {};
        if (id) {
            CampusIdSchema.parse(id);
        }

        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await CampusQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }
}

export default BemController;