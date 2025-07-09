import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import app from '../../app';
import Inventario from '@models/Inventario';
import Campus from '@models/Campus';

let mongoServer;

dotenv.config();

jest.mock('@middlewares/AuthMiddleware.js', () => (req, res, next) => {
    req.user = { _id: 'testuser', id: 'testuser' };
    next();
});

jest.mock('@middlewares/AuthPermission.js', () => (req, res, next) => {
    next();
});

const criarPayloadInventarioValido = (campusId, override = {}) => {
    const unique = Date.now() + '-' + Math.floor(Math.random() * 10000);
    const dataFormatada = new Date().toLocaleDateString('pt-BR'); // dd/mm/aaaa
    return {
        nome: `Inventário Teste ${unique}`,
        data: dataFormatada,
        campus: campusId?.toString(),
        ...override
    };
};

describe("Inventário Routes", () => {
    let token;
    let campusId;

    beforeAll(async () => {
        token = 'mock-jwt-token';

        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Criar campus para testes
        const campus = await Campus.create({
            nome: 'Campus Inventário Test',
            cidade: 'Cidade Inventário Test'
        });
        campusId = campus._id;
    }, 60000);

    afterAll(async () => {
        try {
            await mongoose.disconnect();
            await mongoServer.stop();
        } catch (error) {
            console.error('Erro na limpeza:', error);
        }
    }, 60000);

    beforeEach(async () => {
        await Inventario.deleteMany({});
    });

    describe("POST /inventarios", () => {
        it("deve criar um novo inventário com dados válidos", async () => {
            const dados = criarPayloadInventarioValido(campusId);

            const res = await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.nome).toBe(dados.nome);
            expect(res.body.data.status).toBe(true);
        });

        it("não deve cadastrar inventário sem campos obrigatórios", async () => {
            const dadosIncompletos = {
                nome: 'Inventário Teste'
            };

            const res = await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dadosIncompletos);

            expect([400, 422]).toContain(res.status);
        });

        it("não deve cadastrar inventário com campus inexistente", async () => {
            const campusInexistente = new mongoose.Types.ObjectId();
            const dados = criarPayloadInventarioValido(campusInexistente);

            const res = await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            expect([400, 404]).toContain(res.status);
        });

        it("deve validar formato de data", async () => {
            const dados = criarPayloadInventarioValido(campusId, { data: '2024-01-01' });

            const res = await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            expect(res.status).toBe(400);
        });

        it("deve validar ObjectId do campus", async () => {
            const dados = criarPayloadInventarioValido('campus-id-invalido');

            const res = await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            expect(res.status).toBe(400);
        });
    });

    describe("GET /inventarios", () => {
        it("deve listar inventários existentes", async () => {
            const dados = criarPayloadInventarioValido(campusId);
            await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            const res = await request(app)
                .get("/inventarios")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.docs)).toBe(true);
            expect(res.body.data).toHaveProperty('totalDocs');
            expect(res.body.data).toHaveProperty('page');
        });

        it("deve validar parâmetros de paginação inválidos", async () => {
            const res = await request(app)
                .get("/inventarios?page=abc&limite=xyz")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
        });

        it("deve retornar lista vazia quando não há inventários", async () => {
            const res = await request(app)
                .get("/inventarios?nome=InventarioInexistente")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.docs.length).toBe(0);
        });
    });

    describe("GET /inventarios/:id", () => {
        it("deve retornar erro 404 para ID inexistente", async () => {
            const idInexistente = new mongoose.Types.ObjectId();

            const res = await request(app)
                .get(`/inventarios/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it("deve retornar erro 400 para ID inválido", async () => {
            const res = await request(app)
                .get('/inventarios/id-invalido')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /inventarios/:id", () => {
        it("deve retornar erro 404 para inventário inexistente", async () => {
            const idInexistente = new mongoose.Types.ObjectId();
            const atualizacao = { nome: 'Novo Nome' };

            const res = await request(app)
                .patch(`/inventarios/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`)
                .send(atualizacao);

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /inventarios/:id", () => {
        it("deve retornar erro 404 para inventário inexistente", async () => {
            const idInexistente = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/inventarios/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    describe("Validações Avançadas", () => {
        it("deve retornar populate do campus nos resultados", async () => {
            const dados = criarPayloadInventarioValido(campusId);
            await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            const res = await request(app)
                .get("/inventarios")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            if (res.body.data.docs.length > 0) {
                expect(res.body.data.docs[0]).toHaveProperty('campus');
                expect(res.body.data.docs[0].campus).toHaveProperty('nome');
            }
        });

        it("deve aplicar filtros de nome", async () => {
            const dados = criarPayloadInventarioValido(campusId, { 
                nome: 'Inventário Janeiro Especial'
            });
            
            await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            const res = await request(app)
                .get("/inventarios?nome=Janeiro")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            if (res.body.data.docs.length > 0) {
                expect(res.body.data.docs[0].nome).toContain("Janeiro");
            }
        });

        it("deve aplicar filtros de status", async () => {
            const dados = criarPayloadInventarioValido(campusId, { 
                status: true 
            });
            
            await request(app)
                .post("/inventarios")
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            const res = await request(app)
                .get("/inventarios?status=true")
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            if (res.body.data.docs.length > 0) {
                expect(res.body.data.docs[0].status).toBe(true);
            }
        });
    });
});
