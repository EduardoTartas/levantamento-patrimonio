// src/controllers/UsuarioController.js
import UsuarioService from "../services/UsuarioService.js";
import {UsuarioQuerySchema, UsuarioIdSchema} from "../utils/validators/schemas/zod/querys/UsuarioQuerySchema.js";
import {UsuarioSchema, UsuarioUpdateSchema} from "../utils/validators/schemas/zod/UsuarioSchema.js";
import {CommonResponse, CustomError, HttpStatusCodes} from "../utils/helpers/index.js";

const getDirname = () => path.dirname(fileURLToPath(import.meta.url));

class UsuarioController {
  constructor() {
    this.service = new UsuarioService();
  }

  // Lista usuários. Se um ID é fornecido, retorna um único objeto.
  async listar(req, res) {
    console.log("Estou no listar em UsuarioController");

    const { id } = req.params || {};
    if (id) {
      UsuarioIdSchema.parse(id);
    }

    // Validação das queries (se existirem)
    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      // deve apenas validar o objeto query, tendo erro o zod será responsável por lançar o erro
      await UsuarioQuerySchema.parseAsync(query);
    }

    const data = await this.service.listar(req);
    return CommonResponse.success(res, data);
  }

  async criar(req, res) {
    console.log("Estou no criar em UsuarioController");

    // Cria o DTO de criação e valida os dados
    const parsedData = UsuarioSchema.parse(req.body);

    let data = await this.service.criar(parsedData);

    let usuarioLimpo = data.toObject();

    delete usuarioLimpo.senha;
    return CommonResponse.created(res, usuarioLimpo);
  }

  // Atualiza um usuário existente.
  async atualizar(req, res) {
    console.log("Estou no atualizar em UsuarioController");

    const { id } = req.params;
    UsuarioIdSchema.parse(id);

    const parsedData = UsuarioUpdateSchema.parse(req.body);

    const data = await this.service.atualizar(id, parsedData);
    console.log(data);

    let usuarioLimpo = data.toObject();

    // Remove campos indesejados, como a senha e outros que não devem ser expostos
    delete usuarioLimpo.senha;

    return CommonResponse.success(
      res,
      data,
      200,
      "Usuário atualizado com sucesso. Porém, o e-mail é ignorado em tentativas de atualização, pois é opração proibida."
    );
  }

  async deletar(req, res) {
    console.log("Estou no deletar em UsuarioController");

    const { id } = req.params || {};
    if (!id) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: "validationError",
        field: "id",
        details: [],
        customMessage: "ID do usuário é obrigatório para deletar.",
      });
    }

    const data = await this.service.deletar(id);
    return CommonResponse.success(
      res,
      data,
      200,
      "Usuário excluído com sucesso."
    );
  }
}

export default UsuarioController;
