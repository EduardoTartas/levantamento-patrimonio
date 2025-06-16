import InventarioService from "../services/InventarioService.js";
import {InventarioQuerySchema, InventarioIdSchema} from "../utils/validators/schemas/zod/querys/InventarioQuerySchema.js";
import {InventarioSchema, InventarioUpdateSchema} from "../utils/validators/schemas/zod/InventarioSchema.js";
import {CommonResponse} from "../utils/helpers/index.js";

class InventarioController {
  constructor() {
    this.service = new InventarioService();
  }

  async listar(req, res) {
    console.log("Estou no listar em InventarioController");

    const { id } = req.params || {};
    if (id) {
      InventarioIdSchema.parse(id);
    }

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await InventarioQuerySchema.parseAsync(query);
    }

    const data = await this.service.listar(req);
    return CommonResponse.success(res, data);
  }

  async criar(req, res) {
    console.log("Estou no criar em InventarioController");

    const parsedData = InventarioSchema.parse(req.body);

    let data = await this.service.criar(parsedData);
    
    data = data.toObject();
   
    return CommonResponse.created(res, data);
  
  }

  async atualizar(req, res) {
    console.log("Estou no atualizar em InventarioController");

    const { id } = req.params;
    if(id){
      InventarioIdSchema.parse(id);
    }

    const parsedData = InventarioUpdateSchema.parse(req.body);

    const data = await this.service.atualizar(id, parsedData);

    return CommonResponse.success(
      res,
      data,
      200,
      "Inventario atualizado com sucesso."
    );
  }

  async deletar(req, res) {
    console.log("Estou no deletar em InventarioController");

    const { id } = req.params;
    if(id){
      InventarioIdSchema.parse(id);
    }
    
    const data = await this.service.deletar(id);
    return CommonResponse.success(res, data, 200, "Inventario excluído com sucesso.");
  }
}

export default InventarioController;
