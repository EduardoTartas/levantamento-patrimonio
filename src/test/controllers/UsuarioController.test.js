// src/controllers/__tests__/UsuarioController.test.js

import UsuarioController from '../../controllers/UsuarioController.js';
import UsuarioService from '../../services/UsuarioService.js';
import { UsuarioQuerySchema, UsuarioIdSchema } from '../../utils/validators/schemas/zod/querys/UsuarioQuerySchema.js';
import { UsuarioSchema, UsuarioUpdateSchema } from '../../utils/validators/schemas/zod/UsuarioSchema.js';
import { CommonResponse } from '../../utils/helpers/index.js';

// Mocka o serviço
jest.mock('../../services/UsuarioService.js');

// Mocka os schemas Zod
jest.mock('../../utils/validators/schemas/zod/querys/UsuarioQuerySchema.js', () => ({
    UsuarioIdSchema: {
        parse: jest.fn(),
    },
    UsuarioQuerySchema: {
        parseAsync: jest.fn(),
    },
}));

jest.mock('../../utils/validators/schemas/zod/UsuarioSchema.js', () => ({
    UsuarioSchema: {
        parse: jest.fn(),
    },
    UsuarioUpdateSchema: {
        parse: jest.fn(),
    },
}));

// Mocka o CommonResponse
jest.mock('../../utils/helpers/index.js', () => ({
    CommonResponse: {
        success: jest.fn(),
        created: jest.fn(),
    },
    // Assumindo que CustomError e HttpStatusCodes possam ser usados em outros lugares,
    // mas não diretamente pelos métodos do controller que estão sendo mockados.
    CustomError: jest.fn(),
    HttpStatusCodes: {},
}));


describe('UsuarioController', () => {
    let usuarioController;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reseta os mocks para cada teste
        jest.clearAllMocks();

        usuarioController = new UsuarioController();
        mockReq = {
            params: {},
            query: {},
            body: {},
        };
        mockRes = {}; // Os métodos do CommonResponse atuarão como res para as asserções
    });

    describe('listar', () => {
        it('deve listar todos os usuários quando nenhum ID ou query é fornecido', async () => {
            const mockUsers = [{ nome: 'Usuário 1' }, { nome: 'Usuário 2' }];
            UsuarioService.prototype.listar.mockResolvedValue(mockUsers);
            UsuarioQuerySchema.parseAsync.mockResolvedValue({}); // Simulando o parse de query vazia

            await usuarioController.listar(mockReq, mockRes);

            expect(UsuarioIdSchema.parse).not.toHaveBeenCalled();
            expect(UsuarioQuerySchema.parseAsync).toHaveBeenCalledWith({});
            expect(UsuarioService.prototype.listar).toHaveBeenCalledWith(mockReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, mockUsers);
        });

        it('deve obter um único usuário pelo ID', async () => {
            const userId = 'id-valido';
            const mockUser = { id: userId, nome: 'Usuário 1' };
            mockReq.params.id = userId;
            UsuarioIdSchema.parse.mockReturnValue(userId); // Simula o parse bem-sucedido
            UsuarioService.prototype.listar.mockResolvedValue(mockUser);

            await usuarioController.listar(mockReq, mockRes);

            expect(UsuarioIdSchema.parse).toHaveBeenCalledWith(userId);
            // Ou chamado com {} se a lógica prosseguir, dependendo da implementação exata
            expect(UsuarioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(UsuarioService.prototype.listar).toHaveBeenCalledWith(mockReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, mockUser);
        });

        it('deve listar usuários com parâmetros de query', async () => {
            const query = { nome: 'Teste' };
            const mockUsers = [{ nome: 'Usuário Teste' }];
            mockReq.query = query;
            UsuarioQuerySchema.parseAsync.mockResolvedValue(query); // Simula o parse bem-sucedido
            UsuarioService.prototype.listar.mockResolvedValue(mockUsers);

            await usuarioController.listar(mockReq, mockRes);

            expect(UsuarioIdSchema.parse).not.toHaveBeenCalled();
            expect(UsuarioQuerySchema.parseAsync).toHaveBeenCalledWith(query);
            expect(UsuarioService.prototype.listar).toHaveBeenCalledWith(mockReq);
            expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, mockUsers);
        });

        it('deve lançar erro se a validação do ID falhar', async () => {
            const error = new Error('ID inválido');
            mockReq.params.id = 'id-invalido';
            UsuarioIdSchema.parse.mockImplementation(() => {
                throw error;
            });

            await expect(usuarioController.listar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioService.prototype.listar).not.toHaveBeenCalled();
        });

        it('deve lançar erro se a validação da query falhar', async () => {
            const error = new Error('Query inválida');
            mockReq.query = { parametroRuim: 'teste' };
            UsuarioQuerySchema.parseAsync.mockRejectedValue(error);

            await expect(usuarioController.listar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioService.prototype.listar).not.toHaveBeenCalled();
        });

        it('deve propagar erro do service.listar', async () => {
            const error = new Error('Erro no serviço');
            UsuarioService.prototype.listar.mockRejectedValue(error);
            UsuarioQuerySchema.parseAsync.mockResolvedValue({}); // Para passar pela validação da query

            await expect(usuarioController.listar(mockReq, mockRes)).rejects.toThrow(error);
        });
    });

    describe('criar', () => {
        const mockUserData = { nome: 'Novo Usuário', email: 'novo@exemplo.com', senha: 'senha123', campus: 'idCampus', cpf: '12345678900', cargo: 'Funcionario' };
        // Simula um documento Mongoose com o método toObject
        const mockSavedUser = { ...mockUserData, _id: 'novo-id', toObject: jest.fn() };

        beforeEach(() => {
             // Reseta o mock de toObject para cada teste neste bloco describe
            mockSavedUser.toObject.mockImplementation(function() {
                // 'this' se refere a mockSavedUser neste contexto
                const obj = { ...this };
                delete obj.toObject; // remove a própria função toObject do objeto simples
                return obj;
            });
        });

        it('deve criar um usuário com sucesso', async () => {
            mockReq.body = mockUserData;
            UsuarioSchema.parse.mockReturnValue(mockUserData); // Dados parseados
            UsuarioService.prototype.criar.mockResolvedValue(mockSavedUser);
            
            const plainUserObject = { ...mockSavedUser }; // Objeto após toObject()
            delete plainUserObject.senha; // Conforme a lógica do controller
            delete plainUserObject.toObject; // Remove o mock de toObject do objeto esperado


            await usuarioController.criar(mockReq, mockRes);

            expect(UsuarioSchema.parse).toHaveBeenCalledWith(mockUserData);
            expect(UsuarioService.prototype.criar).toHaveBeenCalledWith(mockUserData);
            expect(mockSavedUser.toObject).toHaveBeenCalled();
            expect(CommonResponse.created).toHaveBeenCalledWith(mockRes, plainUserObject);
        });

        it('deve lançar erro se a validação do corpo da requisição falhar', async () => {
            const error = new Error('Corpo inválido');
            mockReq.body = { nome: 'Inválido' };
            UsuarioSchema.parse.mockImplementation(() => {
                throw error;
            });

            await expect(usuarioController.criar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioService.prototype.criar).not.toHaveBeenCalled();
        });

        it('deve propagar erro do service.criar', async () => {
            const error = new Error('Erro no serviço');
            mockReq.body = mockUserData;
            UsuarioSchema.parse.mockReturnValue(mockUserData);
            UsuarioService.prototype.criar.mockRejectedValue(error);

            await expect(usuarioController.criar(mockReq, mockRes)).rejects.toThrow(error);
        });
    });

    describe('atualizar', () => {
        const userId = 'id-valido';
        const mockUpdateData = { nome: 'Usuário Atualizado' };
        const mockUpdatedUser = { id: userId, ...mockUpdateData };

        it('deve atualizar um usuário com sucesso', async () => {
            mockReq.params.id = userId;
            mockReq.body = mockUpdateData;
            UsuarioIdSchema.parse.mockReturnValue(userId);
            UsuarioUpdateSchema.parse.mockReturnValue(mockUpdateData); // Dados parseados
            UsuarioService.prototype.atualizar.mockResolvedValue(mockUpdatedUser);

            await usuarioController.atualizar(mockReq, mockRes);

            expect(UsuarioIdSchema.parse).toHaveBeenCalledWith(userId);
            expect(UsuarioUpdateSchema.parse).toHaveBeenCalledWith(mockUpdateData);
            expect(UsuarioService.prototype.atualizar).toHaveBeenCalledWith(userId, mockUpdateData);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockRes,
                mockUpdatedUser,
                200,
                "Usuário atualizado com sucesso. Porém, o e-mail é ignorado em tentativas de atualização, pois é opração proibida."
            );
        });

        it('deve lançar erro se a validação do ID falhar para atualização', async () => {
            const error = new Error('ID inválido');
            mockReq.params.id = 'id-invalido';
            UsuarioIdSchema.parse.mockImplementation(() => {
                throw error;
            });

            await expect(usuarioController.atualizar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioUpdateSchema.parse).not.toHaveBeenCalled();
            expect(UsuarioService.prototype.atualizar).not.toHaveBeenCalled();
        });

        it('deve lançar erro se a validação do corpo da requisição falhar para atualização', async () => {
            const error = new Error('Corpo inválido');
            mockReq.params.id = userId;
            mockReq.body = { nome: 123 }; // Dados inválidos
            UsuarioIdSchema.parse.mockReturnValue(userId);
            UsuarioUpdateSchema.parse.mockImplementation(() => {
                throw error;
            });

            await expect(usuarioController.atualizar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioService.prototype.atualizar).not.toHaveBeenCalled();
        });

        it('deve propagar erro do service.atualizar', async () => {
            const error = new Error('Erro no serviço');
            mockReq.params.id = userId;
            mockReq.body = mockUpdateData;
            UsuarioIdSchema.parse.mockReturnValue(userId);
            UsuarioUpdateSchema.parse.mockReturnValue(mockUpdateData);
            UsuarioService.prototype.atualizar.mockRejectedValue(error);

            await expect(usuarioController.atualizar(mockReq, mockRes)).rejects.toThrow(error);
        });
    });

    describe('deletar', () => {
        const userId = 'id-valido';
        const mockDeleteResponse = { deletedCount: 1 };

        it('deve deletar um usuário com sucesso', async () => {
            mockReq.params.id = userId;
            UsuarioIdSchema.parse.mockReturnValue(userId);
            UsuarioService.prototype.deletar.mockResolvedValue(mockDeleteResponse);

            await usuarioController.deletar(mockReq, mockRes);

            expect(UsuarioIdSchema.parse).toHaveBeenCalledWith(userId);
            expect(UsuarioService.prototype.deletar).toHaveBeenCalledWith(userId);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockRes,
                mockDeleteResponse,
                200,
                "Usuário excluído com sucesso."
            );
        });

        it('deve lançar erro se a validação do ID falhar para deleção', async () => {
            const error = new Error('ID inválido');
            mockReq.params.id = 'id-invalido';
            UsuarioIdSchema.parse.mockImplementation(() => {
                throw error;
            });

            await expect(usuarioController.deletar(mockReq, mockRes)).rejects.toThrow(error);
            expect(UsuarioService.prototype.deletar).not.toHaveBeenCalled();
        });

        it('deve propagar erro do service.deletar', async () => {
            const error = new Error('Erro no serviço');
            mockReq.params.id = userId;
            UsuarioIdSchema.parse.mockReturnValue(userId);
            UsuarioService.prototype.deletar.mockRejectedValue(error);

            await expect(usuarioController.deletar(mockReq, mockRes)).rejects.toThrow(error);
        });
    });
});