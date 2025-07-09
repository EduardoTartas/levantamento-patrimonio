import request from "supertest";
import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach
} from "@jest/globals";
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import app from '../../app';
import Campus from '@models/Campus';
import Usuario from '@models/Usuario';

let mongoServer;

dotenv.config();

jest.mock('@middlewares/AuthMiddleware.js', () => (req, res, next) => {
    req.user = { _id: 'testuser', id: 'testuser' };
    next();
});

jest.mock('@middlewares/AuthPermission.js', () => (req, res, next) => {
    next();
});

const criarPayloadCampusValido = (override = {}) => {
    const unique = Date.now() + '-' + Math.floor(Math.random() * 10000);
    return {
        nome: `Campus Teste ${unique}`,
        cidade: `Cidade ${unique}`,
        ...override
    };
};

describe("Campus", () => {
    let token;
    let campusId;
    let adminUserId;

    beforeAll(async () => {
        token = 'mock-jwt-token';

        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        try {
            const adminUser = await Usuario.create({
                nome: 'Admin Campus Test',
                email: 'admincampus@test.com',
                senha: 'admin',
                cargo: 'Funcionario Cpalm',
                campus: new mongoose.Types.ObjectId()
            });
            adminUserId = adminUser._id;
        } catch (error) {
            const existingAdmin = await Usuario.findOne({
                email: 'admincampus@test.com'
            });
            if (existingAdmin) {
                adminUserId = existingAdmin._id;
            }
        }
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
        await Campus.deleteMany({});
        await Usuario.deleteMany({
            _id: {
                $ne: adminUserId
            }
        });
    });

    it("Deve criar um novo campus com dados válidos (POST)", async () => {
        const dados = criarPayloadCampusValido();
        const res = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([200, 201]).toContain(res.status);
        campusId = res.body.data._id;
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.nome).toBe(dados.nome);
        expect(res.body.data.status).toBe(true);
    });

    it("Não deve cadastrar campus sem campos obrigatórios (400)", async () => {
        const res = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send({
                cidade: 'Cidade Teste'
            });

        expect([400, 422]).toContain(res.status);
    });

    it("Não deve cadastrar campus com nome e cidade que já existem (409 ou 400)", async () => {
        const dados = criarPayloadCampusValido();
        await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        const res = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([400, 409]).toContain(res.status);
    });

    it("Deve listar todos os campi (GET)", async () => {
        const dados = criarPayloadCampusValido();
        await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        const res = await request(app)
            .get("/campus")
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.docs)).toBe(true);
    });

    it("Deve retornar um campus por id (GET /campus/:id)", async () => {
        const dados = criarPayloadCampusValido();
        const createRes = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([200, 201]).toContain(createRes.status);
        const campusId = createRes.body.data._id;

        const res = await request(app)
            .get(`/campus/${campusId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('_id', campusId);
    });

    it("Deve retornar 404 para um campus inexistente", async () => {
        const res = await request(app)
            .get(`/campus/000000000000000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it("Deve atualizar o nome de um campus (PATCH)", async () => {
        const dados = criarPayloadCampusValido();
        const createRes = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([200, 201]).toContain(createRes.status);
        const campusId = createRes.body.data._id;
        const novoNome = dados.nome + ' - Atualizado';

        const res = await request(app)
            .patch(`/campus/${campusId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nome: novoNome
            });

        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.data.nome).toBe(novoNome);
        }
    });

    it("Deve retornar 404 ao tentar atualizar um campus inexistente", async () => {
        const res = await request(app)
            .patch(`/campus/000000000000000000000000`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nome: 'Qualquer Nome'
            });

        expect(res.status).toBe(404);
    });

    it("Deve remover um campus sem usuários associados (DELETE)", async () => {
        const dados = criarPayloadCampusValido();
        const createRes = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([200, 201]).toContain(createRes.status);
        const campusId = createRes.body.data._id;

        const res = await request(app)
            .delete(`/campus/${campusId}`)
            .set('Authorization', `Bearer ${token}`);

        expect([200, 204]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.message).toContain('deletada com sucesso');
        }
    });

    it("Deve retornar 404 ao tentar remover um campus inexistente", async () => {
        const res = await request(app)
            .delete(`/campus/000000000000000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it("Deve retornar erro 400 ao tentar remover um campus com usuários associados", async () => {
        const dadosCampus = criarPayloadCampusValido();
        const createCampusRes = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dadosCampus);

        expect([200, 201]).toContain(createCampusRes.status);
        const campusId = createCampusRes.body.data._id;

        await Usuario.create({
            campus: campusId,
            nome: 'Usuário Vinculado',
            email: `vinculado${Date.now()}@teste.com`,
            cpf: `111.222.333-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
            cargo: 'Comissionado'
        });

        const res = await request(app)
            .delete(`/campus/${campusId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Conflito');
    });

    it("Deve aplicar filtro de busca por nome", async () => {
        const nomeFiltro = "CampusFiltro" + Date.now();
        const dados = criarPayloadCampusValido({
            nome: nomeFiltro
        });

        await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        const res = await request(app)
            .get(`/campus?nome=${nomeFiltro}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.docs.some(c => c.nome === nomeFiltro)).toBe(true);
    });

    it("Campus criado deve ter status true por padrão", async () => {
        const dados = criarPayloadCampusValido();
        const res = await request(app)
            .post("/campus")
            .set('Authorization', `Bearer ${token}`)
            .send(dados);

        expect([200, 201]).toContain(res.status);
        expect(res.body.data.status).toBe(true);
    });
});