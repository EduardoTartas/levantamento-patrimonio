//import CampusService from '../services/CampusService.js';
import { CommonResponse, CustomError, HttpStatusCodes} from '../utils/helpers/index.js';
import { InventarioQuerySchema, InventarioIdSchema } from '../utils/validators/schemas/zod/querys/InventarioQuerySchema.js';
import { InventarioSchema} from '../utils/validators/schemas/zod/InventarioSchema.js';

class InventarioController {
    constructor() {
        //this.service = new CampusService();
    }

     // Lista inventarios. Se um ID é fornecido, retorna um único objeto.
    async listar(req, res) {
        console.log('Estou no listar em InventarioControlle, enviando req para InventarioControlle');

        const { id } = req.params || null;
        if (id) {
            InventarioIdSchema.parse(id);
        }

        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await InventarioQuerySchema.parseAsync(query);
        }

        //const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        console.log('Estou no criar em InventarioControlle');

        const parsedData = CampusSchema.parse(req.body);

        const data = await this.service.criar(parsedData);

        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        console.log('Estou no atualizar em InventarioControlle');

        const { id } = req.params || null;
        if (id) {
            CampusIdSchema.parse(id);
        }

        const parsedData = CampusUpdateSchema.parse(req.body);

        const data = await this.service.atualizar(id, parsedData);

        return CommonResponse.success(res, data);
    }

    async deletar(req, res) {
        console.log('Estou no deletar em InventarioControlle');

        const { id } = req.params || null;
        if (id) {
            CampusIdSchema.parse(id);
        }

        const data = await this.service.deletar(id);
        return CommonResponse.success(res, data, 200, 'Inventario deletado com sucesso');
    }
}

export default InventarioController;
