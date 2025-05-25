import bcrypt from "bcrypt";
import UsuarioService from "@services/UsuarioService.js";
import UsuarioRepository from "@repositories/UsuarioRepository.js";
import CampusService from "@services/CampusService.js";
import { CustomError, HttpStatusCodes, messages } from "@utils/helpers/index.js";

jest.mock("@repositories/UsuarioRepository.js");
jest.mock("@services/CampusService.js");
jest.mock("bcrypt");

const mockCustomError = jest.fn();
jest.mock("@utils/helpers/index.js", () => {
    const originalHelpers = jest.requireActual("@utils/helpers/index.js");
    return {
        ...originalHelpers,
        CustomError: jest.fn().mockImplementation(function(args) {
            const instance = new Error(args.customMessage || 'Erro Customizado');
            Object.assign(instance, args);
            instance.name = 'CustomError';
            mockCustomError(args);
            return instance;
        }),
        HttpStatusCodes: { // Garanta que estes são os valores que seu código usa
            BAD_REQUEST: { code: 400, reason: "Bad Request" },
            NOT_FOUND: { code: 404, reason: "Not Found" },
        },
        messages: { // Garanta que esta estrutura corresponde ao seu objeto messages
            error: {
                resourceNotFound: jest.fn(resource => `${resource} não encontrado.`),
            },
        },
    };
});


describe("UsuarioService", () => {
    let usuarioService;
    let mockUsuarioRepositoryInstance;
    let mockCampusServiceInstance;

    beforeEach(() => {
        mockUsuarioRepositoryInstance = {
            listar: jest.fn(),
            criar: jest.fn(),
            atualizar: jest.fn(),
            deletar: jest.fn(),
            buscarPorEmail: jest.fn(),
            buscarPorCpf: jest.fn(),
            buscarPorId: jest.fn(),
        };
        mockCampusServiceInstance = {
            ensureCampExists: jest.fn(),
        };

        UsuarioRepository.mockImplementation(() => mockUsuarioRepositoryInstance);
        CampusService.mockImplementation(() => mockCampusServiceInstance);

        usuarioService = new UsuarioService();
        mockCustomError.mockClear();
        bcrypt.hash.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("listar", () => {
        it("deve chamar repository.listar com os parâmetros corretos e retornar os dados", async () => {
            const mockReq = { query: { status: "ativo" } };
            const mockResponseData = [{ id: "1", nome: "Usuário Teste" }];
            mockUsuarioRepositoryInstance.listar.mockResolvedValue(mockResponseData);

            const resultado = await usuarioService.listar(mockReq);

            expect(mockUsuarioRepositoryInstance.listar).toHaveBeenCalledWith(mockReq);
            expect(resultado).toEqual(mockResponseData);
        });

        it("deve propagar erros do repository.listar", async () => {
            const mockReq = {};
            const erro = new Error("Erro de banco de dados");
            mockUsuarioRepositoryInstance.listar.mockRejectedValue(erro);

            await expect(usuarioService.listar(mockReq)).rejects.toThrow(erro);
        });
    });

    describe("criar", () => {
        let mockParsedData;
        const hashedPassword = "senhaHasheadaSuperSegura";

        beforeEach(() => {
            mockParsedData = {
                nome: "Novo Usuário",
                email: "novo@exemplo.com",
                cpf: "12345678900",
                campus: "campusId123",
                senha: "senhaOriginal123",
            };
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue(null);
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue(null);
            mockCampusServiceInstance.ensureCampExists.mockResolvedValue(true);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockUsuarioRepositoryInstance.criar.mockResolvedValue({ id: "userId1", ...mockParsedData, senha: hashedPassword });
        });

       it("deve criar um usuário com sucesso, hasheando a senha", async () => {
            const result = await usuarioService.criar(mockParsedData);

            expect(mockUsuarioRepositoryInstance.buscarPorEmail).toHaveBeenCalledWith(mockParsedData.email, null);
            expect(mockUsuarioRepositoryInstance.buscarPorCpf).toHaveBeenCalledWith(mockParsedData.cpf, null);
            expect(mockCampusServiceInstance.ensureCampExists).toHaveBeenCalledWith(mockParsedData.campus);
            // CORREÇÃO AQUI: bcrypt.hash é chamado com a senha original
            expect(bcrypt.hash).toHaveBeenCalledWith(mockParsedData.senha, 10);
            expect(mockUsuarioRepositoryInstance.criar).toHaveBeenCalledWith({
                ...mockParsedData,
                senha: hashedPassword,
            });
            expect(result.senha).toBe(hashedPassword);
        });

        it("deve criar um usuário sem senha, se não fornecida", async () => {
            const dataSemSenha = { ...mockParsedData, senha: undefined };
            mockUsuarioRepositoryInstance.criar.mockResolvedValue({ id: "userId1", ...dataSemSenha });

            const result = await usuarioService.criar(dataSemSenha);

            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(mockUsuarioRepositoryInstance.criar).toHaveBeenCalledWith(dataSemSenha);
            expect(result.senha).toBeUndefined();
        });

        it("deve lançar CustomError se o email já existir", async () => {
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue({ id: "outroUser", email: mockParsedData.email });

            await expect(usuarioService.criar(mockParsedData)).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                field: "email",
                customMessage: "Email já está em uso.",
            }));
        });

        it("deve lançar CustomError se o CPF já existir", async () => {
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue({ id: "outroUser", cpf: mockParsedData.cpf });

            await expect(usuarioService.criar(mockParsedData)).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                field: "cpf",
                customMessage: "CPF já está em uso.",
            }));
        });

        it("deve lançar erro se campusService.ensureCampExists falhar", async () => {
            const erroCampus = new Error("Campus não existe");
            mockCampusServiceInstance.ensureCampExists.mockRejectedValue(erroCampus);

            await expect(usuarioService.criar(mockParsedData)).rejects.toThrow(erroCampus);
        });
    });

    describe("atualizar", () => {
        let userId;
        let mockUpdateData;

        beforeEach(() => {
            userId = "userIdExistente";
            mockUpdateData = {
                nome: "Usuário Atualizado",
                email: "atualizado@exemplo.com",
                cpf: "00987654321",
                campus: "campusIdNovo",
                senha: "novaSenha123",
            };

            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue({ id: userId, nome: "Antigo" });
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue(null);
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue(null);
            mockCampusServiceInstance.ensureCampExists.mockResolvedValue(true);
            mockUsuarioRepositoryInstance.atualizar.mockResolvedValue({ id: userId, ...mockUpdateData, email: undefined, senha: undefined });
        });

        it("deve atualizar um usuário com sucesso, deletando email e senha dos dados de atualização", async () => {
            const dadosParaAtualizar = { ...mockUpdateData };
            const usuarioAtualizadoEsperado = { ...dadosParaAtualizar };
            delete usuarioAtualizadoEsperado.email;
            delete usuarioAtualizadoEsperado.senha;

            const resultado = await usuarioService.atualizar(userId, dadosParaAtualizar);

            expect(mockUsuarioRepositoryInstance.buscarPorId).toHaveBeenCalledWith(userId);
            // A asserção aqui espera que 'userId' seja passado, o que requer a correção no UsuarioService.js
            expect(mockUsuarioRepositoryInstance.buscarPorEmail).toHaveBeenCalledWith(mockUpdateData.email, userId);
            expect(mockUsuarioRepositoryInstance.buscarPorCpf).toHaveBeenCalledWith(mockUpdateData.cpf, userId);
            expect(mockCampusServiceInstance.ensureCampExists).toHaveBeenCalledWith(mockUpdateData.campus);
            expect(mockUsuarioRepositoryInstance.atualizar).toHaveBeenCalledWith(userId, usuarioAtualizadoEsperado);
            expect(resultado).toEqual(expect.objectContaining({ nome: "Usuário Atualizado" }));
        });

        it("deve atualizar sem campus se não fornecido", async () => {
            const dataSemCampus = { ...mockUpdateData };
            delete dataSemCampus.campus;
            const usuarioAtualizadoEsperado = { ...dataSemCampus };
            delete usuarioAtualizadoEsperado.email;
            delete usuarioAtualizadoEsperado.senha;

            mockUsuarioRepositoryInstance.atualizar.mockResolvedValue({ id: userId, ...usuarioAtualizadoEsperado });

            await usuarioService.atualizar(userId, dataSemCampus);

            expect(mockCampusServiceInstance.ensureCampExists).not.toHaveBeenCalled();
            expect(mockUsuarioRepositoryInstance.atualizar).toHaveBeenCalledWith(userId, usuarioAtualizadoEsperado);
        });

        it("deve lançar CustomError se usuário não existir", async () => {
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.atualizar(userId, mockUpdateData)).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                customMessage: messages.error.resourceNotFound("Usuário"),
            }));
        });

        it("deve lançar CustomError se email já existir para outro usuário", async () => {
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue({ id: "outroUserId", email: mockUpdateData.email });

            await expect(usuarioService.atualizar(userId, mockUpdateData)).rejects.toThrow(Error);
             expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                field: "email"
            }));
        });

        it("deve lançar CustomError se CPF já existir para outro usuário", async () => {
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue({ id: "outroUserId", cpf: mockUpdateData.cpf });

            await expect(usuarioService.atualizar(userId, mockUpdateData)).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                field: "cpf"
            }));
        });

        it("deve permitir a atualização se o email/cpf não mudou (pertence ao mesmo usuário)", async () => {
            const dadosUsuarioExistente = {
                id: userId,
                nome: "Nome Antigo",
                email: "email.original@exemplo.com",
                cpf: "11122233300",
                campus: "campusOriginal"
            };
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue(dadosUsuarioExistente);

            const dadosParaAtualizar = {
                nome: "Nome Atualizado Mesmo Email",
                email: dadosUsuarioExistente.email,
                cpf: dadosUsuarioExistente.cpf,
                campus: "campusAtualizado"
            };

            mockUsuarioRepositoryInstance.buscarPorEmail.mockImplementation((email, idExclusao) => {
                if (email === dadosUsuarioExistente.email && idExclusao === userId) {
                    return Promise.resolve(null);
                }
                return Promise.resolve({ id: "outroId" });
            });
            mockUsuarioRepositoryInstance.buscarPorCpf.mockImplementation((cpf, idExclusao) => {
                if (cpf === dadosUsuarioExistente.cpf && idExclusao === userId) {
                    return Promise.resolve(null);
                }
                return Promise.resolve({ id: "outroId" });
            });
            
            const dadosEnviadosParaRepo = { ...dadosParaAtualizar };
            delete dadosEnviadosParaRepo.email;
            delete dadosEnviadosParaRepo.senha;

            mockUsuarioRepositoryInstance.atualizar.mockResolvedValue({ ...dadosEnviadosParaRepo, id: userId });

            await expect(usuarioService.atualizar(userId, dadosParaAtualizar)).resolves.toBeDefined();
            expect(mockUsuarioRepositoryInstance.atualizar).toHaveBeenCalledWith(userId, dadosEnviadosParaRepo);
        });
    });

    describe("deletar", () => {
        const userIdValido = "idParaDeletar";

        beforeEach(()=> {
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue({ id: userIdValido });
            mockUsuarioRepositoryInstance.deletar.mockResolvedValue({ "message": "Usuário deletado" });
        })

        it("deve deletar um usuário com sucesso", async () => {
            const result = await usuarioService.deletar(userIdValido);

            expect(mockUsuarioRepositoryInstance.buscarPorId).toHaveBeenCalledWith(userIdValido);
            expect(mockUsuarioRepositoryInstance.deletar).toHaveBeenCalledWith(userIdValido);
            expect(result).toEqual({ "message": "Usuário deletado" });
        });

        it("deve lançar CustomError se o usuário a ser deletado não for encontrado", async () => {
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.deletar("idInexistente")).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                customMessage: messages.error.resourceNotFound("Usuário"),
            }));
            expect(mockUsuarioRepositoryInstance.deletar).not.toHaveBeenCalled();
        });
    });

    describe("validateEmail (auxiliar)", () => {
        it("não deve lançar erro se o email não estiver em uso", async () => {
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue(null);
            await expect(usuarioService.validateEmail("email.novo@teste.com")).resolves.not.toThrow();
            expect(mockUsuarioRepositoryInstance.buscarPorEmail).toHaveBeenCalledWith("email.novo@teste.com", null);
        });

        it("deve lançar CustomError se o email já estiver em uso por outro usuário", async () => {
            mockUsuarioRepositoryInstance.buscarPorEmail.mockResolvedValue({ id: "outroId" });
            await expect(usuarioService.validateEmail("email.existente@teste.com", "idAtual")).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                 statusCode: HttpStatusCodes.BAD_REQUEST.code,
                 field: "email",
            }));
            expect(mockUsuarioRepositoryInstance.buscarPorEmail).toHaveBeenCalledWith("email.existente@teste.com", "idAtual");
        });
    });

     describe("validateCpf (auxiliar)", () => {
        it("não deve lançar erro se CPF não estiver em uso", async () => {
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue(null);
            await expect(usuarioService.validateCpf("12345678900")).resolves.not.toThrow();
            expect(mockUsuarioRepositoryInstance.buscarPorCpf).toHaveBeenCalledWith("12345678900", null);
        });

        it("deve lançar CustomError se CPF estiver em uso", async () => {
            mockUsuarioRepositoryInstance.buscarPorCpf.mockResolvedValue({ id: "idExistente" });
            await expect(usuarioService.validateCpf("00987654321", "idAtual")).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({ field: "cpf" }));
            expect(mockUsuarioRepositoryInstance.buscarPorCpf).toHaveBeenCalledWith("00987654321", "idAtual");
        });
    });

    describe("ensureUserExists (auxiliar)", () => {
        it("deve retornar o usuário se ele existir", async () => {
            const mockUser = { id: "idExistente", nome: "Usuário" };
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue(mockUser);
            const resultado = await usuarioService.ensureUserExists("idExistente");
            expect(resultado).toEqual(mockUser);
        });

        it("deve lançar CustomError se usuário não existir", async () => {
            mockUsuarioRepositoryInstance.buscarPorId.mockResolvedValue(null);
            await expect(usuarioService.ensureUserExists("idInexistente")).rejects.toThrow(Error);
            expect(mockCustomError).toHaveBeenCalledWith(expect.objectContaining({
                 customMessage: messages.error.resourceNotFound("Usuário")
            }));
        });
    });
});