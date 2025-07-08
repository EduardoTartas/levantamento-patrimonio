import ImportacaoService from "@services/ImportacaoService.js";
import { CustomError, HttpStatusCodes } from "@utils/helpers/index.js";

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
        HttpStatusCodes: {
            BAD_REQUEST: { code: 400, reason: "Bad Request" },
        },
    };
});

describe("ImportacaoService", () => {
    beforeEach(() => {
        mockCustomError.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("_extractSalaInfo", () => {
        it("deve extrair nome e bloco corretamente quando localizacao tem formato 'Nome (Bloco)'", () => {
            const resultado = ImportacaoService._extractSalaInfo("Sala A101 (Bloco A)");
            expect(resultado).toEqual({
                nome: "Sala A101",
                bloco: "Bloco A"
            });
        });

        it("deve retornar nome original e 'Não Especificado' quando não há parenteses", () => {
            const resultado = ImportacaoService._extractSalaInfo("Sala A101");
            expect(resultado).toEqual({
                nome: "Sala A101",
                bloco: "Não Especificado"
            });
        });

        it("deve retornar valores padrão quando localizacao é vazia ou null", () => {
            expect(ImportacaoService._extractSalaInfo("")).toEqual({
                nome: "Não Localizado",
                bloco: "Não Especificado"
            });
            
            expect(ImportacaoService._extractSalaInfo(null)).toEqual({
                nome: "Não Localizado",
                bloco: "Não Especificado"
            });
        });
    });

    describe("importCSV", () => {
        const generateValidCSVLine = (overrides = {}) => {
            const defaults = {
                descricaoCompleta: "POLTRONA FIXA ESPALDAR BAIXO. REVESTIMENTO SANLEATHER",
                localizacao: "SALA 27 (BLOCO B)",
                valor: "40000",
                tombo: "200035",
                cpfResponsavel: "00682571202",
                nomeResponsavel: "RODRIGO MARQUES MACHADO"
            };
            const merged = { ...defaults, ...overrides };
            
            const fields = [
                "D", "", 
                merged.descricaoCompleta, 
                "", 
                merged.localizacao, 
                "", "", "", "", "", 
                merged.valor, 
                "", "", "", "", "", "", "", "", "", 
                merged.tombo, 
                "", "", 
                merged.cpfResponsavel, 
                merged.nomeResponsavel
            ];
            
            return fields.join("¥");
        };

        beforeEach(() => {
            ImportacaoService.repository = {
                findSalasByCombinations: jest.fn().mockResolvedValue([]),
                verificarTombosDuplicados: jest.fn().mockResolvedValue([]),
                createSala: jest.fn().mockResolvedValue({ _id: "salaId123", nome: "Sala A101", bloco: "Bloco A" }),
                insertManyBens: jest.fn().mockResolvedValue([{ _id: "bemId123" }]),
            };
        });

        it("deve lançar erro quando campus_id não é fornecido", async () => {
            const mockFile = { buffer: Buffer.from("D¥¥test") };
            const options = {};

            await expect(ImportacaoService.importCSV(mockFile, options)).rejects.toThrow(
                "O ID do campus é obrigatório para a importação."
            );
        });

        it("deve retornar summary vazio quando não há registros para processar", async () => {
            const emptyFile = { buffer: Buffer.from("") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            const resultado = await ImportacaoService.importCSV(emptyFile, options);

            expect(resultado).toEqual({
                totalRecordsProcessed: 0,
                totalRecordsInserted: 0,
                totalRecordsSkipped: 0,
                errors: [],
            });
        });

        it("deve processar CSV com sucesso e inserir novo bem", async () => {
            const csvContent = generateValidCSVLine();
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            const resultado = await ImportacaoService.importCSV(mockFile, options);

            expect(resultado.totalRecordsProcessed).toBe(1);
            expect(resultado.totalRecordsInserted).toBe(1);
            expect(resultado.totalRecordsSkipped).toBe(0);
            expect(resultado.errors).toHaveLength(0);
        });

        it("deve pular bem que já existe (tombamento duplicado)", async () => {
            const csvContent = generateValidCSVLine({ tombo: "200035" });
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            ImportacaoService.repository.verificarTombosDuplicados.mockResolvedValue(["200035"]);

            const resultado = await ImportacaoService.importCSV(mockFile, options);

            expect(resultado.totalRecordsProcessed).toBe(1);
            expect(resultado.totalRecordsInserted).toBe(0);
            expect(resultado.totalRecordsSkipped).toBe(1);
            expect(resultado.errors).toHaveLength(0);
        });

        it("deve tratar erro de banco de dados durante criação", async () => {
            const csvContent = generateValidCSVLine();
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            const mockError = {
                result: { nInserted: 0 },
                writeErrors: [{
                    op: { tombo: "200035" },
                    errmsg: "Erro de duplicata"
                }]
            };
            ImportacaoService.repository.insertManyBens.mockRejectedValue(mockError);

            const resultado = await ImportacaoService.importCSV(mockFile, options);

            expect(resultado.totalRecordsProcessed).toBe(1);
            expect(resultado.totalRecordsInserted).toBe(0);
            expect(resultado.totalRecordsSkipped).toBe(1);
            expect(resultado.errors).toHaveLength(1);
            expect(resultado.errors[0].message).toContain("Falha ao inserir bem (Tombo: 200035)");
        });

        it("deve definir responsável como 'Responsável não informado' quando campo está vazio", async () => {
            const csvContent = generateValidCSVLine({ nomeResponsavel: "" });
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            await ImportacaoService.importCSV(mockFile, options);

            expect(ImportacaoService.repository.insertManyBens).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        responsavel: expect.objectContaining({
                            nome: "Responsável não informado"
                        })
                    })
                ]),
                { ordered: false }
            );
        });

        it("deve definir ocioso como true quando localização contém 'BENS RECOLHIDOS'", async () => {
            const csvContent = generateValidCSVLine({ localizacao: "BENS RECOLHIDOS (MUDANÇA)" });
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            await ImportacaoService.importCSV(mockFile, options);

            expect(ImportacaoService.repository.insertManyBens).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        ocioso: true
                    })
                ]),
                { ordered: false }
            );
        });

        it("deve converter valor monetário corretamente de centavos para reais", async () => {
            const csvContent = generateValidCSVLine({ valor: "68000" });
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            await ImportacaoService.importCSV(mockFile, options);

            expect(ImportacaoService.repository.insertManyBens).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        valor: 680.0
                    })
                ]),
                { ordered: false }
            );
        });

        it("deve extrair nome do bem da descrição antes do primeiro ponto", async () => {
            const csvContent = generateValidCSVLine({ 
                descricaoCompleta: "POLTRONA FIXA ESPALDAR BAIXO.REVESTIMENTO SANLEATHER" 
            });
            const mockFile = { buffer: Buffer.from(csvContent, "utf-8") };
            const options = { campus_id: "507f1f77bcf86cd799439011" };

            await ImportacaoService.importCSV(mockFile, options);

            expect(ImportacaoService.repository.insertManyBens).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        nome: "POLTRONA FIXA ESPALDAR BAIXO"
                    })
                ]),
                { ordered: false }
            );
        });
    });
});