import assert from 'assert';
import CommonResponse from '@utils/helpers/CommonResponse.js';
import StatusService from '@utils/helpers/StatusService.js';

describe('CommonResponse', () => {
    let res;

    beforeEach(() => {
        res = {
            statusCalledWith: null,
            jsonCalledWith: null,
            status(code) {
                this.statusCalledWith = code;
                return this;
            },
            json(data) {
                this.jsonCalledWith = data && typeof data.toJSON === 'function' ? data.toJSON() : data;
            }
        };
    });

    let originalGetHttpCodeMessage;
    let originalGetErrorMessage;

    beforeEach(() => {
        originalGetHttpCodeMessage = StatusService.getHttpCodeMessage;
        originalGetErrorMessage = StatusService.getErrorMessage;
    });

    afterEach(() => {
        StatusService.getHttpCodeMessage = originalGetHttpCodeMessage;
        StatusService.getErrorMessage = originalGetErrorMessage;
    });

    describe('success', () => {
        it('deve retornar resposta de sucesso com mensagem padrão e personalizada', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 200 ? 'Operação bem-sucedida' : `Mensagem para ${code}`);
            
            CommonResponse.success(res, { key: 'value' });
            assert.strictEqual(res.statusCalledWith, 200);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Operação bem-sucedida',
                data: { key: 'value' },
                errors: []
            });

            CommonResponse.success(res, { key: 'value' }, 200, 'Mensagem Personalizada');
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Mensagem Personalizada',
                data: { key: 'value' },
                errors: []
            });
        });

        it('deve retornar resposta de sucesso com código customizado', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 202 ? 'Aceito' : `Mensagem para ${code}`);
            CommonResponse.success(res, { key: 'data' }, 202);

            assert.strictEqual(res.statusCalledWith, 202);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Aceito',
                data: { key: 'data' },
                errors: []
            });
        });
    });

    describe('error', () => {
        it('deve retornar resposta de erro com mensagem padrão e personalizada', () => {
            StatusService.getErrorMessage = (errorType, field) => `Erro ${errorType} no campo ${field}`;

            CommonResponse.error(res, 400, 'tipoErroEspecifico');
            assert.strictEqual(res.statusCalledWith, 400);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Erro tipoErroEspecifico no campo null',
                data: null,
                errors: []
            });

            CommonResponse.error(res, 422, 'validation', 'email');
            assert.strictEqual(res.statusCalledWith, 422);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Erro validation no campo email',
                data: null,
                errors: []
            });
        });

        it('deve retornar resposta de erro com mensagem personalizada e errors', () => {
            StatusService.getErrorMessage = jest.fn(() => 'Não deveria ser chamado');
            const customErrors = [{ field: 'password', message: 'Muito curta' }];
            CommonResponse.error(res, 400, 'authError', 'password', customErrors, 'Falha na Autenticação Customizada');

            assert.strictEqual(res.statusCalledWith, 400);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Falha na Autenticação Customizada',
                data: null,
                errors: customErrors
            });
            expect(StatusService.getErrorMessage).not.toHaveBeenCalled();
        });
    });

    describe('created', () => {
        it('deve retornar resposta de criação com mensagem padrão e personalizada', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 201 ? 'Recurso Criado' : `Msg para ${code}`);
            
            CommonResponse.created(res, { id: 1, name: 'Novo Item' });
            assert.strictEqual(res.statusCalledWith, 201);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Recurso Criado',
                data: { id: 1, name: 'Novo Item' },
                errors: []
            });

            CommonResponse.created(res, { id: 2 }, 'Item especial criado com sucesso!');
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Item especial criado com sucesso!',
                data: { id: 2 },
                errors: []
            });
        });
    });

    describe('serverError', () => {
        it('deve retornar resposta de erro de servidor com mensagem padrão e personalizada', () => {
            StatusService.getErrorMessage = (errorType) => (errorType === 'serverError' ? 'Falha interna do servidor.' : 'Outro erro');
            
            CommonResponse.serverError(res);
            assert.strictEqual(res.statusCalledWith, 500);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Falha interna do servidor.',
                data: null,
                errors: []
            });

            StatusService.getErrorMessage = jest.fn(() => 'Não deveria ser chamado');
            CommonResponse.serverError(res, 'Ocorreu um erro inesperado no servidor.');
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Ocorreu um erro inesperado no servidor.',
                data: null,
                errors: []
            });
            expect(StatusService.getErrorMessage).not.toHaveBeenCalled();
        });
    });

    describe('Instanciação Direta', () => {
        it('deve criar instância com valores padrão e personalizados', () => {
            const response = new CommonResponse('Operação Concluída');
            assert.deepStrictEqual(response.toJSON(), {
                message: 'Operação Concluída',
                data: null,
                errors: []
            });

            const dataPayload = { id: 123, status: 'ativo' };
            const errorDetails = [{ field: 'campoX', reason: 'inválido' }];
            const response2 = new CommonResponse('Processado com detalhes', dataPayload, errorDetails);
            assert.deepStrictEqual(response2.toJSON(), {
                message: 'Processado com detalhes',
                data: dataPayload,
                errors: errorDetails
            });
        });
    });

    describe('getSwaggerSchema', () => {
        it('deve retornar schema Swagger com configurações padrão', () => {
            const schema = CommonResponse.getSwaggerSchema();
            assert.deepStrictEqual(schema, {
                type: "object",
                properties: {
                    data: { type: "array", items: {}, example: [] },
                    message: { type: "string", example: "Operação realizada com sucesso" },
                    errors: { type: "array", example: [] }
                }
            });
        });

        it('deve retornar schema Swagger com referência e mensagem customizada', () => {
            const schemaRef = "#/components/schemas/MeuRecurso";
            const schema = CommonResponse.getSwaggerSchema(schemaRef);
            assert.deepStrictEqual(schema, {
                type: "object",
                properties: {
                    data: { $ref: schemaRef },
                    message: { type: "string", example: "Operação realizada com sucesso" },
                    errors: { type: "array", example: [] }
                }
            });

            const messageExample = "Recurso não encontrado";
            const schema2 = CommonResponse.getSwaggerSchema(null, messageExample);
            assert.deepStrictEqual(schema2, {
                type: "object",
                properties: {
                    data: { type: "array", items: {}, example: [] },
                    message: { type: "string", example: messageExample },
                    errors: { type: "array", example: [] }
                }
            });
        });
    });
});