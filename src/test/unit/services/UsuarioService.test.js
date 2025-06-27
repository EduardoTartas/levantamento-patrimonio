import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UsuarioService from "@services/UsuarioService.js";
import UsuarioRepository from "@repositories/UsuarioRepository.js";
import CampusService from "@services/CampusService.js";
import SendMail from "@utils/SendMail.js";
import Usuario from "@models/Usuario.js";
import CustomError from "@utils/helpers/CustomError.js";

jest.mock("@repositories/UsuarioRepository.js");
jest.mock("@services/CampusService.js");
jest.mock("@utils/SendMail.js");
jest.mock("@models/Usuario.js");
jest.mock("jsonwebtoken");
jest.mock("bcrypt");

describe("UsuarioService", () => {
    let usuarioService;
    let mockRepository;
    let mockCampusService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRepository = new UsuarioRepository();
        mockCampusService = new CampusService();
        usuarioService = new UsuarioService();

        // Forcamos os mocks internos do service para os mocks criados aqui
        usuarioService.repository = mockRepository;
        usuarioService.campusService = mockCampusService;
    });

    describe("listar", () => {
        it("deve chamar repository.listar com o request e retornar resultado", async () => {
            const req = { some: "request" };
            const expectedResult = [{ id: 1, nome: "Thiago" }];
            mockRepository.listar.mockResolvedValue(expectedResult);

            const result = await usuarioService.listar(req);

            expect(mockRepository.listar).toHaveBeenCalledWith(req);
            expect(result).toBe(expectedResult);
        });
    });

    describe("criar", () => {
        it("deve validar email, cpf, campus, criar usuário, gerar token e enviar email", async () => {
            const parsedData = {
                email: "test@test.com",
                cpf: "12345678900",
                campus: "campusId",
                nome: "Thiago",
            };

            const senhaToken = "token123";
            const senhaTokenExpira = new Date(Date.now() + 3600000);

            mockRepository.buscarPorEmail.mockResolvedValue(null);
            mockRepository.buscarPorCpf.mockResolvedValue(null);
            mockCampusService.ensureCampExists.mockResolvedValue(true);

            mockRepository.criar.mockResolvedValue({
                id: "abc123",
                ...parsedData,
                senhaToken,
                senhaTokenExpira
            });
            
            jwt.sign.mockReturnValue("token123");
            SendMail.enviaEmail.mockResolvedValue(true);

            // Substituir os métodos validateEmail e validateCpf para testar fluxo direto
            usuarioService.validateEmail = jest.fn();
            usuarioService.validateCpf = jest.fn();

            const result = await usuarioService.criar(parsedData);

            expect(usuarioService.validateEmail).toHaveBeenCalledWith(parsedData.email);
            expect(usuarioService.validateCpf).toHaveBeenCalledWith(parsedData.cpf);
            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(parsedData.campus);
            expect(jwt.sign).toHaveBeenCalledWith(
                { email: parsedData.email },
                process.env.JWT_SECRET,
                { expiresIn: "1hr" }
            );
            expect(SendMail.enviaEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: parsedData.email,
                    subject: "Criação de senha",
                    html: expect.stringContaining("Olá, Thiago!"),
                })
            );
            expect(result).toEqual({
                id: "abc123",
                ...parsedData,
                senhaToken,
                senhaTokenExpira
            });
        });
    });

    describe("cadastrarSenha", () => {
        it("deve validar token, atualizar senha e limpar token", async () => {
            const token = "valid.token";
            const senha = "novaSenha";
            const decoded = { email: "test@test.com" };
            const usuarioMock = {
                senhaToken: token,
                senhaTokenExpira: new Date(Date.now() + 10000),
                save: jest.fn(),
            };

            jwt.verify.mockReturnValue(decoded);
            Usuario.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(usuarioMock),
            });
            bcrypt.hash.mockResolvedValue("hashSenha");

            const result = await usuarioService.cadastrarSenha(token, senha);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(Usuario.findOne).toHaveBeenCalledWith({ email: decoded.email });
            expect(bcrypt.hash).toHaveBeenCalledWith(senha, 10);
            expect(usuarioMock.senha).toBe("hashSenha");
            expect(usuarioMock.senhaToken).toBeUndefined();
            expect(usuarioMock.senhaTokenExpira).toBeUndefined();
            expect(usuarioMock.save).toHaveBeenCalled();
            expect(result).toEqual({ mensagem: "Senha cadastrada com sucesso!" });
        });

        it("deve lançar erro quando token inválido ou expirado", async () => {
            const token = "tokenInválido";
            jwt.verify.mockImplementation(() => { throw new Error("invalid token"); });

            await expect(usuarioService.cadastrarSenha(token, "senha")).rejects.toThrow(CustomError);
        });
    });

    describe("atualizar", () => {
        it("deve validar existência do usuário e atualizar dados exceto senha e email", async () => {
            const id = "abc123";
            const parsedData = {
                email: "newemail@test.com",
                cpf: "12345678900",
                campus: "campusId",
                nome: "Thiago Atualizado",
                senha: "senha123",
            };

            usuarioService.ensureUserExists = jest.fn().mockResolvedValue(true);
            usuarioService.validateEmail = jest.fn();
            usuarioService.validateCpf = jest.fn();
            mockCampusService.ensureCampExists.mockResolvedValue(true);
            mockRepository.atualizar.mockResolvedValue({ id, ...parsedData });

            const result = await usuarioService.atualizar(id, parsedData);

            expect(usuarioService.ensureUserExists).toHaveBeenCalledWith(id);
            expect(usuarioService.validateEmail).toHaveBeenCalledWith(parsedData.email, id);
            expect(usuarioService.validateCpf).toHaveBeenCalledWith(parsedData.cpf, id);
            expect(mockCampusService.ensureCampExists).toHaveBeenCalledWith(parsedData.campus);
            expect(mockRepository.atualizar).toHaveBeenCalledWith(id, {
                cpf: parsedData.cpf,
                campus: parsedData.campus,
                nome: parsedData.nome,
            });
            expect(result).toEqual({ id, ...parsedData });
        });
    });

    describe("deletar", () => {
        it("deve garantir que o usuário existe e deletar", async () => {
            const id = "abc123";
            usuarioService.ensureUserExists = jest.fn().mockResolvedValue(true);
            mockRepository.deletar.mockResolvedValue(true);

            const result = await usuarioService.deletar(id);

            expect(usuarioService.ensureUserExists).toHaveBeenCalledWith(id);
            expect(mockRepository.deletar).toHaveBeenCalledWith(id);
            expect(result).toBe(true);
        });
    });

    describe("validateEmail", () => {
        it("deve lançar erro se email já existir", async () => {
            mockRepository.buscarPorEmail.mockResolvedValue(true);

            await expect(usuarioService.validateEmail("test@test.com")).rejects.toThrow(CustomError);
        });

        it("não deve lançar erro se email não existir", async () => {
            mockRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(usuarioService.validateEmail("unique@test.com")).resolves.toBeUndefined();
        });
    });

    describe("validateCpf", () => {
        it("deve lançar erro se cpf já existir", async () => {
            mockRepository.buscarPorCpf.mockResolvedValue(true);

            await expect(usuarioService.validateCpf("12345678900")).rejects.toThrow(CustomError);
        });

        it("não deve lançar erro se cpf não existir", async () => {
            mockRepository.buscarPorCpf.mockResolvedValue(null);

            await expect(usuarioService.validateCpf("00011122233")).resolves.toBeNull();
        });
    });

    describe("ensureUserExists", () => {
        it("deve lançar erro se usuário não existir", async () => {
            mockRepository.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.ensureUserExists("abc123")).rejects.toThrow(CustomError);
        });

        it("deve retornar usuário se existir", async () => {
            const user = { id: "abc123" };
            mockRepository.buscarPorId.mockResolvedValue(user);

            const result = await usuarioService.ensureUserExists("abc123");

            expect(result).toBe(user);
        });
    });
});
