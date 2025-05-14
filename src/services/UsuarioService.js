import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import {
    CustomError,
    HttpStatusCodes,
    messages,
} from "../utils/helpers/index.js";

class UsuarioService {
    constructor() {
        this.repository = new UsuarioRepository();
    }

    async listar(req) {
        console.log("Estou no listar em UsuarioService");

        const data = await this.repository.listar(req); 
        return data;
    }

    async criar(parsedData) {
        console.log("Estou no criar em UsuarioService");

        await this.validateEmail(parsedData.email);
        await this.validateCpf(parsedData.cpf);

        if (parsedData.senha) {
            const saltRounds = 10;
            parsedData.senha = await bcrypt.hash(parsedData.senha, saltRounds);
        }

        console.log("Estou processando o schema em UsuarioService" + parsedData);

        const data = await this.repository.criar(parsedData);
        return data;
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em UsuarioService");

        await this.validateEmail(parsedData.email);
        await this.validateCpf(parsedData.cpf);

        // Senha nunca deve ser atualizada
        delete parsedData.senha;
        delete parsedData.email;

        await this.ensureUserExists(id);

        const data = await this.repository.atualizar(id, parsedData);
        return data;
    }

    async deletar(id) {
        console.log("Estou no deletar em UsuarioService");

        await this.ensureUserExists(id);
        
        const data = await this.repository.deletar(id);
        return data;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // MÉTODOS AUXILIARES
    ////////////////////////////////////////////////////////////////////////////////

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
                statusCode: 404,
                errorType: "resourceNotFound",
                field: "Usuário",
                details: [],
                customMessage: messages.error.resourceNotFound("Usuário"),
            });
        }
        return usuarioExistente;
    }
}

export default UsuarioService;