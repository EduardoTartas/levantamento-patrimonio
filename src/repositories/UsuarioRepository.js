import Usuario from "../models/Usuario.js";
import Campus from "../models/Campus.js";
import UsuarioFilterBuilder from "./filters/UsuarioFilterBuilder.js";
import { CustomError, messages } from "../utils/helpers/index.js";

class UsuarioRepository {
  constructor({ Campus: CampusModel = Campus, Usuario: UsuarioModel = Usuario } = {}) {
    if (!UsuarioModel || typeof UsuarioModel.paginate !== "function") {
      throw new Error("The Usuario model must include the paginate method. Ensure mongoose-paginate-v2 is applied.");
    }
    this.model = UsuarioModel;
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
        field: "Usuário",
        details: [],
        customMessage: messages.error.resourceNotFound("Usuário"),
      });
    }
    return user;
  }

  async buscarPorEmail(email, idIgnorado = null) {
    const filtro = { email };

    if (idIgnorado) {
      filtro._id = { $ne: idIgnorado };
    }

    const documento = await this.model.findOne(filtro, "+senha");
    return documento;
  }

  async buscarPorCpf(cpf, idIgnorado = null) {
    const filtro = { cpf };

    if (idIgnorado) {
      filtro._id = { $ne: idIgnorado };
    }

    const documento = await this.model.findOne(filtro);
    return documento;
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
          field: "Usuário",
          details: [],
          customMessage: messages.error.resourceNotFound("Usuário"),
        });
      }

      return data;
    }

    const { nome, ativo = true, page, campus } = req.query;
    const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

    const filterBuilder = new UsuarioFilterBuilder()
      .comNome(nome || "")
      .comAtivo(ativo || "");
    
    await filterBuilder.comCampus(campus || "");
  
    // Validação do filtro de unidade para evitar erro de cast
    if (typeof filterBuilder.build !== "function") {
      throw new CustomError({
        statusCode: 500,
        errorType: "internalServerError",
        field: "Usuário",
        details: [],
        customMessage: messages.error.internalServerError("Usuário"),
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

  async criar(dadosUsuario) {
    const usuario = new this.model(dadosUsuario);
    return await usuario.save();
  }

  async atualizar(id, parsedData) {
    const usuario = await this.model
      .findByIdAndUpdate(id, parsedData, { new: true })
      .populate({
        path: "campus",
        select: "nome _id",
      })
      .lean();

    if (!usuario) {
      throw new CustomError({
        statusCode: 404,
        errorType: "resourceNotFound",
        field: "Usuário",
        details: [],
        customMessage: messages.error.resourceNotFound("Usuário"),
      });
    }
    
    return usuario;
  }

  async deletar(id) {
    return await this.model.findByIdAndDelete(id);
  }
}

export default UsuarioRepository;
