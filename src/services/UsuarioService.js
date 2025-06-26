import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import CampusService from "./CampusService.js";
import SendMail from "../utils/SendMail.js";
import Usuario from "../models/Usuario.js";

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
        await SendMail.enviaEmail({
            to: parsedData.email,
            subject: "Criação de senha",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Criação de Senha</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin-top: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #004d40; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #004d40; font-size: 24px; margin: 0;">Criação de Senha</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Olá <strong>${parsedData.nome}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Bem-vindo ao nosso sistema! Para finalizar seu cadastro, crie uma senha usando o link abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #004d40; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Criar Senha</a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:</p>
            
            <p style="font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${url}</p>
            
            <p style="font-size: 14px; color: #666666; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">Este link expirará em 1 hora por motivos de segurança.</p>
            
            <div style="text-align: center; margin-top: 20px; color: #666666; font-size: 12px;">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p style="margin-top: 10px; color: #004d40;">IFRO Patrimônio - Campus Vilhena</p>
            </div>
            </div>
            </body>
            </html>
            `,
        });

        return novoUsuario;
    }

    async cadastrarSenha(token, senha) {
        try {
            // Verifica se o token é válido
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Busca o usuário com o e-mail do token
            const usuario = await Usuario.findOne({ email: decoded.email }).select("+senhaToken +senhaTokenExpira");

            if (!usuario) {
                throw new CustomError({
                    statusCode: 404,
                    customMessage: "Usuário não encontrado."
                });
            }

            // Verifica se o token confere e não expirou
            if (usuario.senhaToken !== token || usuario.senhaTokenExpira < new Date()) {
                throw new CustomError({
                    statusCode: 400,
                    customMessage: "Token inválido ou expirado."
                });
            }

            // Criptografa a nova senha
            const senhaHash = await bcrypt.hash(senha, 10);
            usuario.senha = senhaHash;

            // Limpa os campos de token
            usuario.senhaToken = undefined;
            usuario.senhaTokenExpira = undefined;

            await usuario.save();

            return { mensagem: "Senha cadastrada com sucesso!" };

        } catch (err) {
            console.error("Erro ao cadastrar senha:", err);
            throw new CustomError({
                statusCode: 400,
                customMessage: "Erro ao cadastrar senha."
            });
        }
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