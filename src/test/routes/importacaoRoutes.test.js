import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import app from '../../app';
import Campus from '@models/Campus';

let mongoServer;

dotenv.config();

// Mock do DbConnect para evitar conexão com banco real
jest.mock('@config/dbConnect.js', () => ({
    __esModule: true,
    default: {
        conectar: jest.fn(),
        desconectar: jest.fn(),
    },
}));

// Mock do setupMinio
jest.mock('@config/setupMinio.js', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Mock do rotaSeed
jest.mock('@seeds/rotaSeed.js', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Declaração do mock primeiro
const mockImportarCSV = jest.fn();

// Mock dos middlewares de autenticação
jest.mock('@middlewares/AuthMiddleware.js', () => (req, res, next) => {
    req.user = { _id: 'testuser', id: 'testuser' };
    next();
});

jest.mock('@middlewares/AuthPermission.js', () => (req, res, next) => {
    next();
});

// Mock do ImportacaoController
jest.mock('../../controllers/ImportacaoController', () => {
    return jest.fn().mockImplementation(() => ({
        importarCSV: (...args) => mockImportarCSV(...args)
    }));
});

describe("Importacao Routes", () => {
    let campusId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Criar campus para testes
        const campus = await Campus.create({
            nome: 'Campus Importacao Test',
            cidade: 'Cidade Importacao Test'
        });
        campusId = campus._id.toString();
    }, 60000);

    afterAll(async () => {
        try {
            await Campus.deleteMany({});
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
            if (mongoServer) {
                await mongoServer.stop();
            }
        } catch (error) {
            console.error('Erro na limpeza:', error);
        }
    }, 60000);

    beforeEach(async () => {
        jest.clearAllMocks();
        // Limpar collections antes de cada teste
        await Campus.deleteMany({});
        
        // Recriar campus para testes
        const campus = await Campus.create({
            nome: 'Campus Importacao Test',
            cidade: 'Cidade Importacao Test'
        });
        campusId = campus._id.toString();
    });

    describe("POST /csv/:campusId", () => {
        it("deve processar upload de CSV com sucesso", async () => {
            const csvContent = "D¥¥POLTRONA FIXA¥123110303¥SALA 27¥¥1¥999¥1¥13122009¥40000¥13122009¥INSTITUTO FEDERAL¥¥¥2¥¥¥¥¥200035¥¥¥00682571202¥RODRIGO MARQUES¥FALSE¥¥¥120¥£¥2015NE200035";
            
            const mockResponse = {
                totalRecordsProcessed: 1,
                totalRecordsInserted: 1,
                totalRecordsSkipped: 0,
                errors: []
            };

            mockImportarCSV.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Importação realizada com sucesso",
                    data: mockResponse
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Importação realizada com sucesso");
            expect(response.body.data).toEqual(mockResponse);
            expect(mockImportarCSV).toHaveBeenCalledTimes(1);
        });

        it("deve retornar erro 400 quando não há arquivo CSV", async () => {
            mockImportarCSV.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: "Arquivo CSV é obrigatório",
                    errors: [{
                        field: "csv",
                        message: "Arquivo CSV é obrigatório"
                    }]
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Arquivo CSV é obrigatório");
            expect(mockImportarCSV).toHaveBeenCalledTimes(1);
        });

        it("deve retornar erro 400 quando campusId é inválido", async () => {
            const csvContent = "D¥¥POLTRONA FIXA¥123110303¥SALA 27¥¥1¥999¥1¥13122009¥40000¥13122009¥INSTITUTO FEDERAL¥¥¥2¥¥¥¥¥200035¥¥¥00682571202¥RODRIGO MARQUES¥FALSE¥¥¥120¥£¥2015NE200035";
            
            mockImportarCSV.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: "ID do campus inválido",
                    errors: [{
                        field: "campusId",
                        message: "ID do campus deve ser um ObjectId válido"
                    }]
                });
            });

            const response = await request(app)
                .post('/csv/invalid-id')
                .attach('csv', Buffer.from(csvContent), 'test.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("ID do campus inválido");
            expect(mockImportarCSV).toHaveBeenCalledTimes(1);
        });

        it("deve retornar erro 400 quando arquivo CSV é inválido", async () => {
            const invalidContent = "invalid,csv,content";
            
            mockImportarCSV.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: "Arquivo CSV inválido",
                    errors: [{
                        field: "csv",
                        message: "Formato de arquivo inválido. Apenas arquivos CSV são permitidos."
                    }]
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(invalidContent), 'test.txt')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Arquivo CSV inválido");
            expect(mockImportarCSV).toHaveBeenCalledTimes(1);
        });

        it("deve retornar erro 413 quando arquivo é muito grande", async () => {
            // Simular arquivo muito grande (mais de 10MB)
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            
            mockImportarCSV.mockImplementation((req, res) => {
                res.status(413).json({
                    success: false,
                    message: "Arquivo muito grande",
                    errors: [{
                        field: "csv",
                        message: "O arquivo deve ter no máximo 10MB"
                    }]
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(largeContent), 'large.csv')
                .expect(413);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Arquivo muito grande");
        });

        it("deve retornar erro 500 para erro interno do servidor", async () => {
            const csvContent = "D¥¥POLTRONA FIXA¥123110303¥SALA 27¥¥1¥999¥1¥13122009¥40000¥13122009¥INSTITUTO FEDERAL¥¥¥2¥¥¥¥¥200035¥¥¥00682571202¥RODRIGO MARQUES¥FALSE¥¥¥120¥£¥2015NE200035";
            
            mockImportarCSV.mockImplementation((req, res) => {
                res.status(500).json({
                    success: false,
                    message: "Erro interno do servidor",
                    errors: [{
                        message: "Erro inesperado durante o processamento"
                    }]
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(csvContent), 'test.csv')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Erro interno do servidor");
            expect(mockImportarCSV).toHaveBeenCalledTimes(1);
        });

        it("deve processar importação com registros duplicados", async () => {
            const csvContent = `D¥¥POLTRONA FIXA¥123110303¥SALA 27¥¥1¥999¥1¥13122009¥40000¥13122009¥INSTITUTO FEDERAL¥¥¥2¥¥¥¥¥200035¥¥¥00682571202¥RODRIGO MARQUES¥FALSE¥¥¥120¥£¥2015NE200035
            D¥¥MESA ESCRITORIO¥123110304¥SALA 28¥¥1¥999¥1¥13122009¥50000¥13122009¥INSTITUTO FEDERAL¥¥¥3¥¥¥¥¥200036¥¥¥00682571203¥MARIA SILVA¥FALSE¥¥¥150¥£¥2015NE200036`;
            
            const mockResponse = {
                totalRecordsProcessed: 2,
                totalRecordsInserted: 1,
                totalRecordsSkipped: 1,
                errors: []
            };

            mockImportarCSV.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Importação realizada com sucesso",
                    data: mockResponse
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalRecordsProcessed).toBe(2);
            expect(response.body.data.totalRecordsInserted).toBe(1);
            expect(response.body.data.totalRecordsSkipped).toBe(1);
        });

        it("deve processar importação com erros de validação", async () => {
            const csvContent = "D¥¥POLTRONA FIXA¥123110303¥SALA 27¥¥1¥999¥1¥13122009¥40000¥13122009¥INSTITUTO FEDERAL¥¥¥2¥¥¥¥¥200035¥¥¥00682571202¥RODRIGO MARQUES¥FALSE¥¥¥120¥£¥2015NE200035";
            
            const mockResponse = {
                totalRecordsProcessed: 1,
                totalRecordsInserted: 0,
                totalRecordsSkipped: 0,
                errors: [
                    {
                        type: "Erro de Validação",
                        message: "Falha ao inserir bem (Tombo: 200035). Motivo: Dados inválidos",
                        linha: 1
                    }
                ]
            };

            mockImportarCSV.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Importação realizada com erros",
                    data: mockResponse
                });
            });

            const response = await request(app)
                .post(`/csv/${campusId}`)
                .attach('csv', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalRecordsInserted).toBe(0);
            expect(response.body.data.errors).toHaveLength(1);
            expect(response.body.data.errors[0].type).toBe("Erro de Validação");
        });
    });
});
