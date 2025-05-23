
import CampusService from '../services/CampusService.js';
import { CommonResponse, CustomError, HttpStatusCodes} from '../utils/helpers/index.js';
import { CampusQuerySchema, CampusIdSchema } from '../utils/validators/schemas/zod/querys/CampusQuerySchema.js';
import { CampusSchema, CampusUpdateSchema } from '../utils/validators/schemas/zod/CampusSchema.js';

class CampusController {
    constructor() {
        this.service = new CampusService();
    }

     // Lista campus. Se um ID é fornecido, retorna um único objeto.
    async listar(req, res) {
        console.log('Estou no listar em UnidadeController, enviando req para UnidadeService');

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

    async criar(req, res) {
        console.log('Estou no criar em CampusController');

        const parsedData = CampusSchema.parse(req.body);

        const data = await this.service.criar(parsedData);

        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        console.log('Estou no atualizar em CampusController');

        const { id } = req.params || null;
        if (id) {
            CampusIdSchema.parse(id);
        }

        const parsedData = CampusUpdateSchema.parse(req.body);

        const data = await this.service.atualizar(id, parsedData);

        return CommonResponse.success(res, data);
    }

    async deletar(req, res) {
        console.log('Estou no deletar em CampusController');

        const { id } = req.params || null;
        if (id) {
            CampusIdSchema.parse(id);
        }

        const data = await this.service.deletar(id);
        return CommonResponse.success(res, data, 200, 'Unidade deletada com sucesso');
    }
}

export default CampusController;
