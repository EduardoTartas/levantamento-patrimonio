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
        it('deve retornar uma resposta de sucesso com mensagem padrão (code 200)', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 200 ? 'Operação bem-sucedida' : `Mensagem para ${code}`);
            CommonResponse.success(res, { key: 'value' });

            assert.strictEqual(res.statusCalledWith, 200, 'O status HTTP deve ser 200');
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Operação bem-sucedida',
                data: { key: 'value' },
                errors: []
            }, 'A resposta JSON deve corresponder ao esperado');
        });

        it('deve retornar uma resposta de sucesso com mensagem padrão para outro code', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 202 ? 'Aceito' : `Mensagem para ${code}`);
            CommonResponse.success(res, { key: 'data' }, 202);

            assert.strictEqual(res.statusCalledWith, 202);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Aceito',
                data: { key: 'data' },
                errors: []
            });
        });

        it('deve retornar uma resposta de sucesso com mensagem personalizada', () => {
            CommonResponse.success(res, { key: 'value' }, 200, 'Mensagem de Sucesso Personalizada');
            assert.strictEqual(res.statusCalledWith, 200);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Mensagem de Sucesso Personalizada',
                data: { key: 'value' },
                errors: []
            });
        });
    });

    describe('error', () => {
        it('deve retornar uma resposta de erro com mensagem padrão (baseada em errorType e field null)', () => {
            StatusService.getErrorMessage = (errorType, field) => `Erro ${errorType} no campo ${field}`;

            CommonResponse.error(res, 400, 'tipoErroEspecifico');

            assert.strictEqual(res.statusCalledWith, 400);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Erro tipoErroEspecifico no campo null',
                data: null,
                errors: []
            });
        });

        it('deve retornar uma resposta de erro com mensagem padrão (baseada em errorType e field fornecido)', () => {
            StatusService.getErrorMessage = (errorType, field) => `Erro ${errorType} no campo ${field}`;
            CommonResponse.error(res, 422, 'validation', 'email');

            assert.strictEqual(res.statusCalledWith, 422);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Erro validation no campo email',
                data: null,
                errors: []
            });
        });

        it('deve retornar uma resposta de erro com mensagem personalizada (ignora StatusService)', () => {
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

        it('deve retornar uma resposta de erro com array de errors populado', () => {
            StatusService.getErrorMessage = () => 'Erro genérico';
            const errorDetails = ['Erro A', 'Erro B'];
            CommonResponse.error(res, 500, 'serverSide', null, errorDetails);

            assert.strictEqual(res.statusCalledWith, 500);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Erro genérico',
                data: null,
                errors: errorDetails
            });
        });
    });

    describe('created', () => {
        it('deve retornar uma resposta de criação (201) sem mensagem personalizada', () => {
            StatusService.getHttpCodeMessage = (code) => (code === 201 ? 'Recurso Criado' : `Msg para ${code}`);
            CommonResponse.created(res, { id: 1, name: 'Novo Item' });

            assert.strictEqual(res.statusCalledWith, 201);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Recurso Criado',
                data: { id: 1, name: 'Novo Item' },
                errors: []
            });
        });

        it('deve retornar uma resposta de criação (201) com mensagem personalizada', () => {
            CommonResponse.created(res, { id: 2 }, 'Item especial criado com sucesso!');
            assert.strictEqual(res.statusCalledWith, 201);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Item especial criado com sucesso!',
                data: { id: 2 },
                errors: []
            });
        });
    });

    describe('serverError', () => {
        it('deve retornar uma resposta de erro de servidor (500) com mensagem padrão', () => {
            StatusService.getErrorMessage = (errorType) => (errorType === 'serverError' ? 'Falha interna do servidor.' : 'Outro erro');
            CommonResponse.serverError(res);

            assert.strictEqual(res.statusCalledWith, 500);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Falha interna do servidor.',
                data: null,
                errors: []
            });
        });

        it('deve retornar uma resposta de erro de servidor (500) com mensagem personalizada', () => {
            StatusService.getErrorMessage = jest.fn(() => 'Não deveria ser chamado');
            CommonResponse.serverError(res, 'Ocorreu um erro inesperado no servidor.');

            assert.strictEqual(res.statusCalledWith, 500);
            assert.deepStrictEqual(res.jsonCalledWith, {
                message: 'Ocorreu um erro inesperado no servidor.',
                data: null,
                errors: []
            });
            expect(StatusService.getErrorMessage).not.toHaveBeenCalled();
        });
    });

    describe('Instanciação Direta (Corrigido)', () => {
        it('deve criar uma instância com mensagem, e data/errors como default (null/[])', () => {
            const response = new CommonResponse('Operação Concluída');
            assert.deepStrictEqual(response.toJSON(), {
                message: 'Operação Concluída',
                data: null,
                errors: []
            }, 'A instância criada deve ter data=null e errors=[] por padrão');
        });

        it('deve criar uma instância com todos os parâmetros fornecidos (message, data, errors)', () => {
            const dataPayload = { id: 123, status: 'ativo' };
            const errorDetails = [{ field: 'campoX', reason: 'inválido' }];
            const response = new CommonResponse('Processado com detalhes', dataPayload, errorDetails);
            assert.deepStrictEqual(response.toJSON(), {
                message: 'Processado com detalhes',
                data: dataPayload,
                errors: errorDetails
            }, 'A instância criada deve refletir todos os parâmetros fornecidos');
        });
    });

    describe('getSwaggerSchema', () => {
        it('deve retornar o schema Swagger com data como array e mensagem padrão quando schemaRef é null', () => {
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

        it('deve retornar o schema Swagger com referência de data quando schemaRef é fornecido', () => {
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
        });

        it('deve retornar o schema Swagger com mensagem customizada', () => {
            const messageExample = "Recurso não encontrado";
            const schema = CommonResponse.getSwaggerSchema(null, messageExample);
            assert.deepStrictEqual(schema, {
                type: "object",
                properties: {
                    data: { type: "array", items: {}, example: [] },
                    message: { type: "string", example: messageExample },
                    errors: { type: "array", example: [] }
                }
            });
        });

         it('deve retornar o schema Swagger com referência de data e mensagem customizada', () => {
            const schemaRef = "#/components/schemas/OutroRecurso";
            const messageExample = "Recurso atualizado";
            const schema = CommonResponse.getSwaggerSchema(schemaRef, messageExample);
            assert.deepStrictEqual(schema, {
                type: "object",
                properties: {
                    data: { $ref: schemaRef },
                    message: { type: "string", example: messageExample },
                    errors: { type: "array", example: [] }
                }
            });
        });
    });
});