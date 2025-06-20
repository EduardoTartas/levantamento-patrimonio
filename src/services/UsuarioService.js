import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import CampusService from "./CampusService.js";
import { enviarEmail } from "../utils/email.js"

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

        // Isso irá fazer com que nenhuma senha seja registrada
        delete parsedData.senha;

        // Para maior segurança um token temporário será gerado
        const token = jwt.sign(
            { email: parsedData.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1hr" }
        );

        parsedData.senhaToken = token;
        parsedData.senhaTokenExpira = new Date(Date.now() + 3600000);

        const novoUsuario = await this.repository.criar(parsedData);
        
        // Irá enviar o email com link para criação de senha
        const url = `${process.env.CADASTRAR_SENHA_URL}?token=${token}`;
        await enviarEmail({
            to: parsedData.email,
            subject: "Criação de senha",
            html: `
                <p>Olá, ${parsedData.nome}!</p>
                <p>Para criar sua senha, clique no link abaixo:</p>
                <a href="${url}">Criar senha
            `
        });

        return novoUsuario;
    }

    async atualizar(id, parsedData) {
        console.log("Estou no atualizar em UsuarioService");

        await this.ensureUserExists(id);

        if (parsedData.hasOwnProperty('email') && parsedData.email !== undefined) {
            await this.validateEmail(parsedData.email, id);
        }

        if (parsedData.hasOwnProperty('cpf') && parsedData.cpf !== undefined) {
            await this.validateCpf(parsedData.cpf, id);
        }

        if (parsedData.campus) {
            await this.campusService.ensureCampExists(parsedData.campus);
        }

        const dataToUpdate = { ...parsedData };

        delete dataToUpdate.senha;
        delete dataToUpdate.email;

        return this.repository.atualizar(id, dataToUpdate);
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