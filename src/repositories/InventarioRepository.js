import Inventario from "../models/Inventario.js";
import Campus from "../models/Campus.js";
import InventarioFilterBuilder from "./filters/InventarioFilterBuild.js"
import { CustomError, messages } from "../utils/helpers/index.js";

class InventarioRepository {
  constructor({ Campus: CampusModel = Campus, Inventario: InventarioModel = Inventario } = {}) {
    if (!InventarioModel || typeof InventarioModel.paginate !== "function") {
      throw new Error("The inventario model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
    }
    this.model = InventarioModel;
  }

  async buscarPorId(id, includeTokens = false) {
    let query = this.model.findById(id);

    if (includeTokens) {
      query = query.select("+refreshtoken +accesstoken");
    }

    const user = await query;
    if (!user) {
      throw new CustomError({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    }
    return user;
  }

  async listar(req) {
    const id = req.params.id || null;

    if (id) {
      const data = await this.model
        .findById(id)
        .populate({
          path: "campus",
          select: "nome _id",
        })
        .lean();

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: "resourceNotFound",
          field: "Inventário",
          details: [],
          customMessage: messages.error.resourceNotFound("Inventário"),
        });
      }

      return data;
    }

    const { nome, ativo = true, data, page, campus } = req.query;
    const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

    const filterBuilder = new InventarioFilterBuilder()
      .comNome(nome || "")
      .comAtivo(ativo || "")
      .comData(data || "");
    
    await filterBuilder.comCampus(campus || "");
  
    // Validação do filtro de Inventário para evitar erro de cast
    if (typeof filterBuilder.build !== "function") {
      throw new CustomError({
        statusCode: 500,
        errorType: "internalServerError",
        field: "Inventário",
        details: [],
        customMessage: messages.error.internalServerError("Inventário"),
      });
    }

    const filtros = filterBuilder.build();

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limite, 10),
      populate: {
        path: "campus",
        select: "nome _id",
      },
      sort: { nome: 1 },
      lean: true,
    };

    return await this.model.paginate(filtros, options);
  }

  async criar(parsedData) {
    const inventario = new this.model(parsedData);
    return await inventario.save();
  }

  async atualizar(id, parsedData) {
    const inventario = await this.model
      .findByIdAndUpdate(id, parsedData, { new: true })
      .populate({
        path: "campus",
        select: "nome _id",
      })
      .lean();

    if (!inventario) {
      throw new CustomError({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Inventário",
        details: [],
        customMessage: messages.error.resourceNotFound("Inventário"),
      });
    }
    
    return inventario;
  }

  async deletar(id) {
    return await this.model.findByIdAndDelete(id);
  }
}

export default InventarioRepository;
