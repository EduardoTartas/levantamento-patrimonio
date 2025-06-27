import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../../app';
import Campus from '@models/Campus';
import Usuario from '@models/Usuario';

dotenv.config();

let token;

// Mock para os middlewares, caso não estejam sendo mockados globalmente no setup do Jest
jest.mock('../../middlewares/AuthMiddleware', () => (req, res, next) => {
    req.user = { id: 'testuser' };
    next();
});

jest.mock('../../middlewares/AuthPermission', () => (req, res, next) => {
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

describe('Testes de Endpoint para a Rota /campus', () => {
    let adminUserId;

    // -- SETUP INICIAL --
    beforeAll(async () => {
        const adminEmail = 'admincampus@test.com';
        const senhaAdmin = 'Admin1234!';

        // Cria um usuário admin para os testes, se não existir
        let adminUser = await Usuario.findOne({ email: adminEmail });
        if (!adminUser) {
            adminUser = await new Usuario({
                nome: 'Admin Campus Test',
                email: adminEmail,
                senha: senhaAdmin,
                cargo: 'Funcionario Cpalm',
                campus: new mongoose.Types.ObjectId()
            }).save();
        }
        adminUserId = adminUser._id;

        // Como o middleware está mockado, o token pode ser qualquer string.
        token = 'mock-jwt-token';
        expect(token).toBeTruthy();
    }, 10000); // Aumenta o timeout para 10 segundos

    // Limpa as coleções antes de cada teste
    beforeEach(async () => {
        await Campus.deleteMany({});
        await Usuario.deleteMany({ _id: { $ne: adminUserId } }); // Mantém o admin
    });

    // -- TESTES DE CRIAÇÃO (POST) --
    describe('POST /campus', () => {
        it('deve criar um novo campus com dados válidos', async () => {
            const dados = criarPayloadCampusValido();
            const res = await request(app)
                .post('/campus')
                .set('Authorization', `Bearer ${token}`)
                .send(dados);

            expect([200, 201]).toContain(res.status);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.nome).toBe(dados.nome);
            expect(res.body.data.status).toBe(true); // Verifica o valor padrão
        });

        it('deve falhar ao cadastrar sem campos obrigatórios', async () => {
            const res = await request(app)
                .post('/campus')
                .set('Authorization', `Bearer ${token}`)
                .send({ cidade: 'Cidade Teste' }); // 'nome' faltando

            expect([400, 422]).toContain(res.status);
        });

        it('deve falhar ao cadastrar com um nome e cidade que já existem', async () => {
            const dados = criarPayloadCampusValido();
            await request(app).post('/campus').set('Authorization', `Bearer ${token}`).send(dados);
            const res = await request(app).post('/campus').set('Authorization', `Bearer ${token}`).send(dados);

            expect([400, 409]).toContain(res.status); // Espera erro de conflito ou requisição inválida
        });
    });

    // -- TESTES DE LEITURA (GET) --
    describe('GET /campus', () => {
        it('deve listar todos os campi', async () => {
            await Campus.create(criarPayloadCampusValido());
            const res = await request(app).get('/campus').set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.docs)).toBe(true);
        });

        it('deve retornar um campus por id', async () => {
            const campus = await new Campus(criarPayloadCampusValido()).save();
            const res = await request(app).get(`/campus/${campus._id}`).set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('_id', campus._id.toString());
        });

        it('deve retornar 404 para um campus inexistente', async () => {
            const idInexistente = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/campus/${idInexistente}`).set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    // -- TESTES DE ATUALIZAÇÃO (PATCH) --
    describe('PATCH /campus/:id', () => {
        it('deve atualizar o nome de um campus', async () => {
            const campus = await new Campus(criarPayloadCampusValido()).save();
            const novoNome = campus.nome + ' - Atualizado';
            const res = await request(app)
                .patch(`/campus/${campus._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ nome: novoNome });

            expect(res.status).toBe(200);
            expect(res.body.data.nome).toBe(novoNome);
        });

        it('deve retornar 404 ao tentar atualizar um campus inexistente', async () => {
            const idInexistente = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch(`/campus/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ nome: 'Qualquer Nome' });

            expect(res.status).toBe(404);
        });
    });

    // -- TESTES DE DELEÇÃO (DELETE) --
    describe('DELETE /campus/:id', () => {
        it('deve remover um campus sem usuários associados', async () => {
            const campus = await new Campus(criarPayloadCampusValido()).save();
            const res = await request(app).delete(`/campus/${campus._id}`).set('Authorization', `Bearer ${token}`);

            expect([200, 204]).toContain(res.status);
            if (res.status === 200) {
                 expect(res.body.message).toContain('deletada com sucesso');
            }
        });

        it('deve retornar 404 ao tentar remover um campus inexistente', async () => {
            const idInexistente = new mongoose.Types.ObjectId();
            const res = await request(app).delete(`/campus/${idInexistente}`).set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('deve retornar erro 400 ao tentar remover um campus com usuários associados', async () => {
            const campusComUsuario = await new Campus(criarPayloadCampusValido()).save();
            await new Usuario({
                campus: campusComUsuario._id,
                nome: 'Usuário Vinculado',
                email: 'vinculado@teste.com',
                cpf: '111.222.333-44',
                cargo: 'Comissionado'
            }).save();

            const res = await request(app).delete(`/campus/${campusComUsuario._id}`).set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('conflito');
        });
    });
});