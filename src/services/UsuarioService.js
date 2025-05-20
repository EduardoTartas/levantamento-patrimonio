import bcrypt from "bcrypt";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import CampusService from "./CampusService.js";

class UsuarioService {
    constructor() {
        this.repository = new UsuarioRepository();
        this.campusService = new CampusService();
    }

    async listar(req) {
        console.log("Estou no listar em UsuarioService");
        return this.repository.listar(req);
    }

    async criar(parsedData) {
        console.log("Estou no criar em UsuarioService");

        await this.validateEmail(parsedData.email);
        await this.validateCpf(parsedData.cpf);
        await this.campusService.ensureCampExists(parsedData.campus);

        if (parsedData.senha) {
            const saltRounds = 10;
            parsedData.senha = await bcrypt.hash(parsedData.senha, saltRounds);
        }

        console.log(`Estou processando o schema em UsuarioService ${parsedData}`);
        return this.repository.criar(parsedData);
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em UsuarioService");

        await this.validateEmail(parsedData.email);
        await this.validateCpf(parsedData.cpf);
        await this.ensureUserExists(id);
         if (parsedData.campus) {
            await this.campusService.ensureCampExists(parsedData.campus);
        }

        delete parsedData.senha;
        delete parsedData.email;

        return this.repository.atualizar(id, parsedData);
    }

    async deletar(id) {
        console.log("Estou no deletar em UsuarioService");
        await this.ensureUserExists(id);
        return this.repository.deletar(id);
    }

    // Métodos auxiliares
    
    async validateEmail(email, id = null) {
        const usuarioExistente = await this.repository.buscarPorEmail(email, id);
        if (usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "validationError",
                field: "email",
                details: [{
                    path: "email",
                    message: "Email já está em uso."
                }],
                customMessage: "Email já está em uso.",
            });
        }
    }

    async validateCpf(cpf, id = null) {
        const usuarioExistente = await this.repository.buscarPorCpf(cpf, id);
        if (usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "validationError",
                field: "cpf",
                details: [{
                    path: "cpf",
                    message: "CPF já está em uso."
                }],
                customMessage: "CPF já está em uso.",
            });
        }
        return usuarioExistente;
    }

    async ensureUserExists(id) {
        const usuarioExistente = await this.repository.buscarPorId(id);
        if (!usuarioExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: "resourceNotFound",
                field: "Usuário",
                details: [{
                    path: "id",
                    message: "Usuário não encontrado."
                }],
                customMessage: messages.error.resourceNotFound("Usuário"),
            });
        }
        return usuarioExistente;
    }
}

export default UsuarioService;