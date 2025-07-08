import ImportacaoRepository from '@repositories/ImportacaoRepository.js';

const mockSalaFindOne = jest.fn();
const mockSalaFind = jest.fn();
const mockSalaSave = jest.fn();
const mockBemFind = jest.fn();
const mockBemInsertMany = jest.fn();

const mockCustomErrorTracker = jest.fn();
const mockMessagesErrorInternalServerError = jest.fn(resource => `Erro interno no servidor ao processar ${resource}.`);

jest.mock('@models/Sala.js', () => {
    const MockedSalaConstructor = jest.fn().mockImplementation(function(data) {
        this.nome = data.nome;
        this.bloco = data.bloco;
        this.campus = data.campus;
        this.save = () => mockSalaSave();
        return this;
    });

    MockedSalaConstructor.findOne = (...args) => mockSalaFindOne(...args);
    MockedSalaConstructor.find = (...args) => mockSalaFind(...args);

    return MockedSalaConstructor;
});

jest.mock('@models/Bem.js', () => {
    const MockedBemConstructor = jest.fn();

    MockedBemConstructor.find = (...args) => mockBemFind(...args);
    MockedBemConstructor.insertMany = (...args) => mockBemInsertMany(...args);

    return MockedBemConstructor;
});

jest.mock('@utils/helpers/index.js', () => ({
    CustomError: jest.fn().mockImplementation(function(args) {
        const instance = new Error(args.customMessage || 'Erro Customizado');
        Object.assign(instance, args);
        instance.name = 'CustomError';
        mockCustomErrorTracker(args);
        return instance;
    }),
    messages: {
        error: {
            internalServerError: (...args) => mockMessagesErrorInternalServerError(...args),
        },
    },
}));

describe('ImportacaoRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCustomErrorTracker.mockClear();
    });

    describe('findSala', () => {
        it('deve encontrar sala com nome, bloco e campus corretos', async () => {
            const mockSala = { 
                _id: 'salaId123', 
                nome: 'Sala A101', 
                bloco: 'Bloco A', 
                campus: 'campusId123' 
            };
            mockSalaFindOne.mockResolvedValue(mockSala);

            const resultado = await ImportacaoRepository.findSala('Sala A101', 'Bloco A', 'campusId123');

            expect(mockSalaFindOne).toHaveBeenCalledWith({
                nome: 'Sala A101',
                bloco: 'Bloco A',
                campus: 'campusId123'
            });
            expect(resultado).toEqual(mockSala);
        });

        it('deve retornar null quando sala não é encontrada', async () => {
            mockSalaFindOne.mockResolvedValue(null);

            const resultado = await ImportacaoRepository.findSala('Sala Inexistente', 'Bloco X', 'campusId123');

            expect(resultado).toBeNull();
        });
    });

    describe('findSalasByCombinations', () => {
        it('deve retornar array vazio quando combinations é vazio', async () => {
            const resultado = await ImportacaoRepository.findSalasByCombinations([], 'campusId123');

            expect(resultado).toEqual([]);
            expect(mockSalaFind).not.toHaveBeenCalled();
        });

        it('deve buscar salas com múltiplas combinações', async () => {
            const combinations = [
                { nome: 'Sala A101', bloco: 'Bloco A' },
                { nome: 'Sala B202', bloco: 'Bloco B' }
            ];
            const mockSalas = [
                { _id: 'sala1', nome: 'Sala A101', bloco: 'Bloco A' },
                { _id: 'sala2', nome: 'Sala B202', bloco: 'Bloco B' }
            ];
            mockSalaFind.mockResolvedValue(mockSalas);

            const resultado = await ImportacaoRepository.findSalasByCombinations(combinations, 'campusId123');

            expect(mockSalaFind).toHaveBeenCalledWith({
                $and: [
                    { campus: 'campusId123' },
                    {
                        $or: [
                            { nome: 'Sala A101', bloco: 'Bloco A' },
                            { nome: 'Sala B202', bloco: 'Bloco B' }
                        ]
                    }
                ]
            });
            expect(resultado).toEqual(mockSalas);
        });
    });

    describe('createSala', () => {
        it('deve criar nova sala com sucesso', async () => {
            const mockSalaCriada = { 
                _id: 'novaSalaId', 
                nome: 'Nova Sala', 
                bloco: 'Novo Bloco', 
                campus: 'campusId123' 
            };
            mockSalaSave.mockResolvedValue(mockSalaCriada);

            const resultado = await ImportacaoRepository.createSala('Nova Sala', 'Novo Bloco', 'campusId123');

            expect(mockSalaSave).toHaveBeenCalled();
            expect(resultado).toEqual(mockSalaCriada);
        });

        it('deve lançar CustomError quando falha ao criar sala', async () => {
            const mockError = new Error('Erro de validação');
            mockSalaSave.mockRejectedValue(mockError);

            await expect(ImportacaoRepository.createSala('Sala', 'Bloco', 'campusId123'))
                .rejects
                .toThrow('Erro interno no servidor ao processar Sala.');

            expect(mockCustomErrorTracker).toHaveBeenCalledWith({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Sala',
                details: [{ message: 'Erro de validação' }],
                customMessage: 'Erro interno no servidor ao processar Sala.'
            });
        });
    });

    describe('verificarTombosDuplicados', () => {
        it('deve retornar array vazio quando não há tombos válidos', async () => {
            const resultado = await ImportacaoRepository.verificarTombosDuplicados(['', '  ', null]);

            expect(resultado).toEqual([]);
            expect(mockBemFind).not.toHaveBeenCalled();
        });

        it('deve retornar tombos duplicados encontrados', async () => {
            const tombos = ['123456', '789012', '345678'];
            const mockBensEncontrados = [
                { tombo: '123456' },
                { tombo: '789012' }
            ];
            
            const mockSelect = jest.fn().mockResolvedValue(mockBensEncontrados);
            mockBemFind.mockReturnValue({ select: mockSelect });

            const resultado = await ImportacaoRepository.verificarTombosDuplicados(tombos);

            expect(mockBemFind).toHaveBeenCalledWith({
                tombo: { $in: ['123456', '789012', '345678'] }
            });
            expect(mockSelect).toHaveBeenCalledWith('tombo');
            expect(resultado).toEqual(['123456', '789012']);
        });

        it('deve filtrar tombos vazios antes da consulta', async () => {
            const tombos = ['123456', '', '789012', '  ', null, undefined];
            const mockBensEncontrados = [{ tombo: '123456' }];
            
            const mockSelect = jest.fn().mockResolvedValue(mockBensEncontrados);
            mockBemFind.mockReturnValue({ select: mockSelect });

            const resultado = await ImportacaoRepository.verificarTombosDuplicados(tombos);

            expect(mockBemFind).toHaveBeenCalledWith({
                tombo: { $in: ['123456', '789012'] }
            });
            expect(resultado).toEqual(['123456']);
        });
    });

    describe('insertManyBens', () => {
        it('deve inserir múltiplos bens com sucesso', async () => {
            const bens = [
                { nome: 'Mesa', tombo: '123456' },
                { nome: 'Cadeira', tombo: '789012' }
            ];
            const bensInseridos = [
                { _id: 'bem1', nome: 'Mesa', tombo: '123456' },
                { _id: 'bem2', nome: 'Cadeira', tombo: '789012' }
            ];
            mockBemInsertMany.mockResolvedValue(bensInseridos);

            const resultado = await ImportacaoRepository.insertManyBens(bens, { ordered: false });

            expect(mockBemInsertMany).toHaveBeenCalledWith(bens, { ordered: false });
            expect(resultado).toEqual(bensInseridos);
        });

        it('deve usar opções padrão quando não fornecidas', async () => {
            const bens = [{ nome: 'Mesa', tombo: '123456' }];
            const bensInseridos = [{ _id: 'bem1', nome: 'Mesa', tombo: '123456' }];
            mockBemInsertMany.mockResolvedValue(bensInseridos);

            const resultado = await ImportacaoRepository.insertManyBens(bens);

            expect(mockBemInsertMany).toHaveBeenCalledWith(bens, {});
            expect(resultado).toEqual(bensInseridos);
        });

        it('deve repassar erro com writeErrors sem modificação', async () => {
            const mockError = {
                writeErrors: [
                    { op: { tombo: '123456' }, errmsg: 'Tombo duplicado' }
                ]
            };
            mockBemInsertMany.mockRejectedValue(mockError);

            await expect(ImportacaoRepository.insertManyBens([{ nome: 'Mesa' }]))
                .rejects
                .toEqual(mockError);

            expect(mockCustomErrorTracker).not.toHaveBeenCalled();
        });

        it('deve lançar CustomError para outros tipos de erro', async () => {
            const mockError = new Error('Erro de conexão');
            mockBemInsertMany.mockRejectedValue(mockError);

            await expect(ImportacaoRepository.insertManyBens([{ nome: 'Mesa' }]))
                .rejects
                .toThrow('Erro interno no servidor ao processar Bem.');

            expect(mockCustomErrorTracker).toHaveBeenCalledWith({
                statusCode: 500,
                errorType: 'internalServerError',
                field: 'Bem',
                details: [{ message: 'Erro de conexão' }],
                customMessage: 'Erro interno no servidor ao processar Bem.'
            });
        });
    });
});
