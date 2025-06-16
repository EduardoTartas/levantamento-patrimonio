import LevantamentoService from "../services/LevantamentoService.js";
import {LevantamentoQuerySchema, LevantamentoIdSchema} from "../utils/validators/schemas/zod/querys/LevantamentoQuerySchema.js";
import {LevantamentoSchema, LevantamentoUpdateSchema} from "../utils/validators/schemas/zod/LevantamentoSchema.js";
import {CommonResponse, CustomError, HttpStatusCodes} from "../utils/helpers/index.js";

class LevantamentoController {
    constructor() {
        this.service = new LevantamentoService();
    }

 async listar(req, res) {
        console.log("Estou no listar em LevantamentoController");

        const { id } = req.params || {};
        if (id) {
            LevantamentoIdSchema.parse(id);
        }

        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await LevantamentoQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async criar(req, res) {
        console.log("Estou no criar em LevantamentoController");

        const parsedData = LevantamentoSchema.parse(req.body);
        parsedData.usuario = req.user_id

        const data = await this.service.criar(parsedData);
        
        return CommonResponse.created(res, data);
    }

    async atualizar(req, res) {
        console.log("Estou no atualizar em LevantamentoController");

        const { id } = req.params;
        if (id) {
            LevantamentoIdSchema.parse(id);
        }

        const parsedData = LevantamentoUpdateSchema.parse(req.body);

        const data = await this.service.atualizar(id, parsedData);

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            "Levantamento atualizado com sucesso. Porém, novos id de bens e invenatarios são ignorado em tentativas de atualização, pois é opração proibida."
        );
    }

    async deletar(req, res) {
        console.log("Estou no deletar em LevantamentoController");

        const { id } = req.params;
        if (id) {
            LevantamentoIdSchema.parse(id);
        }
        
        const data = await this.service.deletar(id);
        return CommonResponse.success(res, data, HttpStatusCodes.OK.code, "Levantamento excluído com sucesso.");
    }

    async adicionarFoto(req, res) {
        console.log("Estou no adicionarFoto em LevantamentoController");

        const { id } = req.params;
        LevantamentoIdSchema.parse(id);

        if (!req.file) {
            throw new CustomError("Nenhum arquivo de foto foi enviado.", HttpStatusCodes.BAD_REQUEST);
        }

        const data = await this.service.adicionarFoto(id, req.file);

        return CommonResponse.success(
            res,
            data,
            HttpStatusCodes.OK.code,
            "Foto adicionada com sucesso."
        );
    }
}

export default LevantamentoController;
