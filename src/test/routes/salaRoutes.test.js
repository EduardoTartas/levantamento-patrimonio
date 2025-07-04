import request from 'supertest';
import express from 'express';
import router from '@routes/salaRoutes';

jest.mock('@controllers/SalaController.js', () => {
    return jest.fn().mockImplementation(() => ({
        listar: (req, res) => {
            const id = req.params.id;
            const isObjectId = id ? /^[0-9a-fA-F]{24}$/.test(id) : false;

            if (id && !isObjectId) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id) {
                return res.status(200).json({ id, nome: "Sala Mockada" });
            }

            return res.status(200).json([
                { id: "1", nome: "Sala A" },
                { id: "2", nome: "Sala B" },
            ]);
        }
    }));
});

describe('Testes de rota /salas', () => {
    const app = express();
    app.use(express.json());
    app.use(router);

    it('GET /salas deve retornar status 200', async () => {
        const response = await request(app).get('/salas');
        expect(response.status).toBe(200);
        // Outros testes de estrutura aqui se necessário
    });

    it('GET /salas/:id com ID válido deve retornar 200', async () => {
        const idFalso = '655f5e39884c8b76c56a5083'; // um ObjectId de exemplo válido
        const response = await request(app).get(`/salas/${idFalso}`);
        expect(response.status).toBe(200);
    });

    it('GET /salas/:id com ID inválido deve retornar erro', async () => {
        const idInvalido = '123';
        const response = await request(app).get(`/salas/${idInvalido}`);
        expect(response.status).toBeGreaterThanOrEqual(400);
    });
});
