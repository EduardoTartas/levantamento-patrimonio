import { afterEach, beforeEach, describe, jest, expect } from "@jest/globals";
import ImportacaoController from "@controllers/ImportacaoController";
import ImportacaoService from "@services/ImportacaoService";
import { CommonResponse, CustomError, HttpStatusCodes } from "@utils/helpers/index.js";
import { CampusIdSchema } from "@utils/validators/schemas/zod/querys/CampusQuerySchema.js";
import { fileUploadValidationSchema } from "@utils/validators/schemas/zod/ImportacaoSchema.js";

jest.mock("@services/ImportacaoService.js");
jest.mock("@utils/helpers/index.js", () => ({
    CommonResponse: {
        created: jest.fn(),
    },
    CustomError: jest.fn().mockImplementation((options) => {
        const error = new Error(options.customMessage || 'Custom Error');
        error.statusCode = options.statusCode;
        error.errorType = options.errorType;
        error.field = options.field;
        throw error;
    }),
    HttpStatusCodes: {
        BAD_REQUEST: {
            code: 400,
        },
    },
}));

jest.mock("@utils/validators/schemas/zod/querys/CampusQuerySchema.js", () => ({
    CampusIdSchema: {
        parse: jest.fn(),
    },
}));

jest.mock("@utils/validators/schemas/zod/ImportacaoSchema.js", () => ({
    fileUploadValidationSchema: {
        parse: jest.fn(),
    },
}));

describe("ImportacaoController", () => {
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    let controller;
    let req, res;

    beforeEach(() => {
        controller = new ImportacaoController();
        req = { 
            params: {}, 
            query: {}, 
            body: {},
            file: null 
        };
        res = mockResponse();

        ImportacaoService.importCSV = jest.fn();
    });

    afterEach(() => jest.clearAllMocks());

    describe("importarCSV", () => {
        const mockFile = {
            fieldname: 'csvFile',
            originalname: 'test-file.csv',
            encoding: '7bit',
            mimetype: 'text/csv',
            buffer: Buffer.from('col1,col2\nval1,val2'),
            size: 1024
        };

        const mockImportSummary = {
            totalRecordsProcessed: 10,
            totalRecordsInserted: 8,
            totalRecordsSkipped: 2,
            errors: []
        };

        it("deve importar CSV com sucesso quando campusId é fornecido", async () => {
            req.params.campusId = "507f1f77bcf86cd799439011";
            req.file = mockFile;

            CampusIdSchema.parse.mockReturnValue(true);
            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummary);

            await controller.importarCSV(req, res);

            expect(CampusIdSchema.parse).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
            expect(fileUploadValidationSchema.parse).toHaveBeenCalledWith(mockFile);
            expect(ImportacaoService.importCSV).toHaveBeenCalledWith(mockFile, {
                nome: mockFile.originalname,
                campus_id: "507f1f77bcf86cd799439011"
            });
            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    message: `Importação do arquivo '${mockFile.originalname}' concluída.`,
                    totalRecordsProcessed: 10,
                    totalRecordsInserted: 8,
                    totalRecordsSkipped: 2,
                    errorsCount: 0,
                    errorSamples: []
                }),
                "Importação concluída com sucesso."
            );
        });

        it("deve importar CSV com sucesso quando campusId não é fornecido", async () => {
            req.params = {};
            req.file = mockFile;

            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummary);

            await controller.importarCSV(req, res);

            expect(CampusIdSchema.parse).not.toHaveBeenCalled();
            expect(fileUploadValidationSchema.parse).toHaveBeenCalledWith(mockFile);
            expect(ImportacaoService.importCSV).toHaveBeenCalledWith(mockFile, {
                nome: mockFile.originalname,
                campus_id: undefined
            });
            expect(CommonResponse.created).toHaveBeenCalled();
        });

        it("deve importar CSV e retornar erro samples quando há erros", async () => {
            const mockImportSummaryWithErrors = {
                ...mockImportSummary,
                totalRecordsInserted: 5,
                errors: [
                    { type: "validation", message: "Campo obrigatório", linha: 2 },
                    { type: "duplicate", message: "Registro duplicado", linha: 5 },
                    { type: "validation", message: "Formato inválido", linha: 8 }
                ]
            };

            req.file = mockFile;
            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummaryWithErrors);

            await controller.importarCSV(req, res);

            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    errorsCount: 3,
                    errorSamples: [
                        { type: "validation", message: "Campo obrigatório", linha: 2 },
                        { type: "duplicate", message: "Registro duplicado", linha: 5 },
                        { type: "validation", message: "Formato inválido", linha: 8 }
                    ]
                }),
                `Importação concluída com ${mockImportSummaryWithErrors.errors.length} erros. Veja os detalhes na resposta.`
            );
        });

        it("deve limitar error samples a 10 quando há muitos erros", async () => {
            const manyErrors = Array.from({ length: 15 }, (_, i) => ({
                type: "validation",
                message: `Erro ${i + 1}`,
                linha: i + 1
            }));

            const mockImportSummaryWithManyErrors = {
                ...mockImportSummary,
                errors: manyErrors
            };

            req.file = mockFile;
            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummaryWithManyErrors);

            await controller.importarCSV(req, res);

            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    errorsCount: 15,
                    errorSamples: expect.arrayContaining([
                        expect.objectContaining({ type: "validation", message: "Erro 1", linha: 1 })
                    ])
                }),
                expect.any(String)
            );

            const call = CommonResponse.created.mock.calls[0];
            expect(call[1].errorSamples).toHaveLength(10);
        });

        it("deve lançar erro quando nenhum arquivo é enviado", async () => {
            req.file = null;

            await expect(controller.importarCSV(req, res)).rejects.toThrow(
                "Nenhum arquivo CSV enviado. Por favor, inclua um arquivo."
            );
            expect(fileUploadValidationSchema.parse).not.toHaveBeenCalled();
            expect(ImportacaoService.importCSV).not.toHaveBeenCalled();
        });

        it("deve lançar erro quando req.file é undefined", async () => {
            delete req.file;

            await expect(controller.importarCSV(req, res)).rejects.toThrow(
                "Nenhum arquivo CSV enviado. Por favor, inclua um arquivo."
            );
            expect(fileUploadValidationSchema.parse).not.toHaveBeenCalled();
            expect(ImportacaoService.importCSV).not.toHaveBeenCalled();
        });

        it("deve propagar erro quando validação do campusId falha", async () => {
            const validationError = new Error("ID de campus inválido");
            req.params.campusId = "invalid-id";
            req.file = mockFile;

            CampusIdSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.importarCSV(req, res)).rejects.toThrow(validationError);
            expect(fileUploadValidationSchema.parse).not.toHaveBeenCalled();
            expect(ImportacaoService.importCSV).not.toHaveBeenCalled();
        });

        it("deve propagar erro quando validação do arquivo falha", async () => {
            const validationError = new Error("Arquivo inválido");
            req.file = mockFile;

            fileUploadValidationSchema.parse.mockImplementation(() => {
                throw validationError;
            });

            await expect(controller.importarCSV(req, res)).rejects.toThrow(validationError);
            expect(ImportacaoService.importCSV).not.toHaveBeenCalled();
        });

        it("deve propagar erro quando o service falha", async () => {
            const serviceError = new Error("Erro no processamento");
            req.file = mockFile;

            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockRejectedValue(serviceError);

            await expect(controller.importarCSV(req, res)).rejects.toThrow(serviceError);
            expect(CommonResponse.created).not.toHaveBeenCalled();
        });

        it("deve funcionar corretamente quando req.params é undefined", async () => {
            req.params = undefined;
            req.file = mockFile;

            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummary);

            await controller.importarCSV(req, res);

            expect(CampusIdSchema.parse).not.toHaveBeenCalled();
            expect(ImportacaoService.importCSV).toHaveBeenCalledWith(mockFile, {
                nome: mockFile.originalname,
                campus_id: undefined
            });
        });

        it("deve processar arquivo com nome diferente corretamente", async () => {
            const customFile = {
                ...mockFile,
                originalname: 'dados-patrimonio-2024.csv'
            };
            req.file = customFile;

            fileUploadValidationSchema.parse.mockReturnValue(true);
            ImportacaoService.importCSV.mockResolvedValue(mockImportSummary);

            await controller.importarCSV(req, res);

            expect(ImportacaoService.importCSV).toHaveBeenCalledWith(customFile, {
                nome: 'dados-patrimonio-2024.csv',
                campus_id: undefined
            });
            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    message: "Importação do arquivo 'dados-patrimonio-2024.csv' concluída."
                }),
                expect.any(String)
            );
        });
    });
});
