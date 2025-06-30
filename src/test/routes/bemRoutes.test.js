import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../../app';
import Bem from '@models/Bem';
import Sala from '@models/Sala';
import Campus from '@models/Campus';

dotenv.config();

jest.mock('../../middlewares/AuthMiddleware', () => (req, res, next) => {
    req.user = { id: 'testuser' };
    next();
});

jest.mock('../../middlewares/AuthPermission', () => (req, res, next) => {
    next();
});

describe("Bem Routes", () => {
    let token;
    let campusId;
    let salaId;

    const criarPayloadBemValido = (override = {}) => {
        const unique = Date.now() + '-' + Math.floor(Math.random() * 10000);
        return {
            nome: `Bem Teste ${unique}`,
            tombo: `12345${unique}`,
            descricao: `Descrição do bem ${unique}`,
            sala: salaId,
            valor: 1000.50,
            responsavel: {
                nome: `Responsavel ${unique}`,
                cpf: "123.456.789-10"
            },
            ...override
        };
    };

    beforeAll(async () => {
        token = 'mock-jwt-token';

        if (mongoose.connection.readyState === 0) {
            const mongoUri = process.env.DB_URL_TESTE || process.env.DB_URL || 'mongodb://localhost:27017/levantamento_patrimonio_test';
            await mongoose.connect(mongoUri);
        }

        // Criar campus e sala para testes
        const campus = await Campus.create({
            nome: 'Campus Bem Test',
            cidade: 'Cidade Bem Test'
        });
        campusId = campus._id;

        const sala = await Sala.create({
            nome: 'Sala Bem Test',
            campus: campusId,
            bloco: 'A'
        });
        salaId = sala._id;
    }, 30000);

    afterAll(async () => {
        try {
            await Bem.deleteMany({});
            await Sala.deleteMany({});
            await Campus.deleteMany({});
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
        } catch (error) {
            console.error('Erro na limpeza:', error);
        }
    });

    beforeEach(async () => {
        await Bem.deleteMany({});
    });

    it("Deve listar todos os bens (GET /bens)", async () => {
        // Criar alguns bens para testar
        const bem1 = criarPayloadBemValido();
        const bem2 = criarPayloadBemValido();
        
        await Bem.create(bem1);
        await Bem.create(bem2);

        const res = await request(app)
            .get("/bens")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data.docs.length).toBe(2);
        expect(res.body.data).toHaveProperty('totalDocs');
        expect(res.body.data).toHaveProperty('page');
        expect(res.body.data).toHaveProperty('totalPages');
    });

    it("Deve retornar lista vazia quando não há bens cadastrados", async () => {
        const res = await request(app)
            .get("/bens")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
        expect(res.body.data.docs.length).toBe(0);
        expect(res.body.data.totalDocs).toBe(0);
    });

    it("Deve retornar um bem específico por ID (GET /bens/:id)", async () => {
        const bemData = criarPayloadBemValido();
        const bem = await Bem.create(bemData);

        const res = await request(app)
            .get(`/bens/${bem._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('_id', bem._id.toString());
        expect(res.body.data.nome).toBe(bemData.nome);
        expect(res.body.data.tombo).toBe(bemData.tombo);
    });

    it("Deve retornar 404 para um bem inexistente", async () => {
        const objectId = new mongoose.Types.ObjectId();
        
        const res = await request(app)
            .get(`/bens/${objectId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toContain('Recurso não encontrado');
    });

    it("Deve retornar 400 para ID inválido", async () => {
        const res = await request(app)
            .get(`/bens/id-invalido`)
            .set('Authorization', `Bearer ${token}`);

        expect([400, 422]).toContain(res.status);
    });

    it("Deve aplicar filtro de busca por nome", async () => {
        const nomeEspecifico = "BemFiltroNome" + Date.now();
        const bem1 = criarPayloadBemValido({ nome: nomeEspecifico });
        const bem2 = criarPayloadBemValido({ nome: "Outro Bem" });
        
        await Bem.create(bem1);
        await Bem.create(bem2);

        const res = await request(app)
            .get(`/bens?nome=${nomeEspecifico}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(1);
        expect(res.body.data.docs[0].nome).toBe(nomeEspecifico);
    });

    it("Deve aplicar filtro de busca por tombo", async () => {
        const tomboEspecifico = "TOMBO" + Date.now();
        const bem1 = criarPayloadBemValido({ tombo: tomboEspecifico });
        const bem2 = criarPayloadBemValido({ tombo: "OUTRO123" });
        
        await Bem.create(bem1);
        await Bem.create(bem2);

        const res = await request(app)
            .get(`/bens?tombo=${tomboEspecifico}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(1);
        expect(res.body.data.docs[0].tombo).toBe(tomboEspecifico);
    });

    it("Deve aplicar filtro de busca por sala", async () => {
        // Criar outra sala para teste
        const outraSala = await Sala.create({
            nome: 'Sala Filtro Test',
            campus: campusId,
            bloco: 'B'
        });

        const bem1 = criarPayloadBemValido({ sala: salaId });
        const bem2 = criarPayloadBemValido({ sala: outraSala._id });
        
        await Bem.create(bem1);
        await Bem.create(bem2);

        const res = await request(app)
            .get(`/bens?sala=${salaId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(1);
        expect(res.body.data.docs[0].sala._id).toBe(salaId.toString());

        // Limpeza
        await Sala.deleteOne({ _id: outraSala._id });
    });

    it("Deve aplicar paginação corretamente", async () => {
        // Criar 7 bens para testar paginação
        for (let i = 0; i < 7; i++) {
            await Bem.create(criarPayloadBemValido());
        }

        const res = await request(app)
            .get("/bens?page=2&limite=3")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(3);
        expect(res.body.data.page).toBe(2);
        expect(res.body.data.totalDocs).toBe(7);
        expect(res.body.data.totalPages).toBe(3);
    });

    it("Deve aplicar múltiplos filtros simultaneamente", async () => {
        const unique1 = Date.now() + '-' + Math.floor(Math.random() * 100000);
        const unique2 = Date.now() + '-' + Math.floor(Math.random() * 100000);
        const unique3 = Date.now() + '-' + Math.floor(Math.random() * 100000);
        
        const nomeEspecifico = "MultiTest" + unique1;
        const tomboEspecifico = "TOMBO" + unique1;
        
        const bem1 = criarPayloadBemValido({ 
            nome: nomeEspecifico, 
            tombo: tomboEspecifico,
            sala: salaId 
        });
        const bem2 = criarPayloadBemValido({ 
            nome: "Outro Nome", 
            tombo: "OUTRO" + unique2,
            sala: salaId 
        });
        const bem3 = criarPayloadBemValido({ 
            nome: nomeEspecifico, 
            tombo: "DIFERENTE" + unique3,
            sala: salaId 
        });
        
        await Bem.create(bem1);
        await Bem.create(bem2);
        await Bem.create(bem3);

        // Testando filtro combinado de nome e tombo (sem especificar sala pois já está no objeto)
        const res = await request(app)
            .get(`/bens?nome=${nomeEspecifico}&tombo=${tomboEspecifico}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(1);
        expect(res.body.data.docs[0].nome).toBe(nomeEspecifico);
        expect(res.body.data.docs[0].tombo).toBe(tomboEspecifico);
    });

    it("Deve retornar lista vazia quando filtros não encontram resultados", async () => {
        await Bem.create(criarPayloadBemValido());

        const res = await request(app)
            .get("/bens?nome=NomeInexistente")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(0);
        expect(res.body.data.totalDocs).toBe(0);
    });

    it("Deve usar valores padrão de paginação quando não especificados", async () => {
        await Bem.create(criarPayloadBemValido());

        const res = await request(app)
            .get("/bens")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.page).toBe(1);
        expect(res.body.data.limit).toBe(10); // valor padrão esperado
    });

    it("Deve listar bens ordenados por nome", async () => {
        const bem1 = await Bem.create(criarPayloadBemValido({ nome: "Zebra" }));
        const bem2 = await Bem.create(criarPayloadBemValido({ nome: "Abelha" }));

        const res = await request(app)
            .get("/bens")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.length).toBe(2);
        
        // Verificar se está ordenado por nome (A-Z)
        const primeiroItem = res.body.data.docs[0];
        const segundoItem = res.body.data.docs[1];
        
        expect(primeiroItem.nome.localeCompare(segundoItem.nome)).toBeLessThanOrEqual(0);
    });
});
