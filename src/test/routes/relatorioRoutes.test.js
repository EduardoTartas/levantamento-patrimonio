import request from 'supertest';
import express from 'express';
import router from '@routes/relatorioRoutes';

jest.mock('@utils/helpers/index.js', () => ({
    asyncWrapper: (fn) => fn
}));

jest.mock('@controllers/RelatorioController.js', () => {
    return jest.fn().mockImplementation(() => ({
        gerar: (req, res) => {
            const { inventarioId, tipoRelatorio, sala } = req.query;
            
            if (!inventarioId || !tipoRelatorio) {
                return res.status(400).json({
                    message: "inventarioId e tipoRelatorio são obrigatórios."
                });
            }

            const tiposValidos = [
                'geral',
                'bens_danificados',
                'bens_inserviveis',
                'bens_ociosos',
                'bens_nao_encontrados',
                'bens_sem_etiqueta'
            ];

            if (!tiposValidos.includes(tipoRelatorio)) {
                return res.status(400).json({
                    message: "Tipo de relatório inválido"
                });
            }

            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(inventarioId)) {
                return res.status(400).json({
                    message: "ID do inventário inválido"
                });
            }

            if (sala && !isValidObjectId(sala)) {
                return res.status(400).json({
                    message: "ID da sala inválido"
                });
            }

            if (inventarioId === '655f5e39884c8b76c56a5099') {
                return res.status(404).json({
                    message: "Inventário não encontrado"
                });
            }

            if (sala === '655f5e39884c8b76c56a5098') {
                return res.status(404).json({
                    message: "Sala não encontrada"
                });
            }

            const pdfBuffer = Buffer.from('fake-pdf-content');
            
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=relatorio.pdf");
            
            return res.send(pdfBuffer);
        }
    }));
});

describe('Testes de Rotas /relatorios', () => {
    const app = express();
    app.use(express.json());
    app.use(router);

    describe('GET /relatorios - Gerar relatório', () => {
        it('deve gerar relatório geral com sucesso', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'geral'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
            expect(response.headers['content-disposition']).toBe('attachment; filename=relatorio.pdf');
            expect(Buffer.isBuffer(response.body)).toBe(true);
        });

        it('deve gerar relatório de bens danificados', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'bens_danificados'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve gerar relatório com filtro de sala', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'geral',
                    sala: '655f5e39884c8b76c56a5086'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve retornar erro 400 para campos obrigatórios faltantes', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('inventarioId e tipoRelatorio são obrigatórios.');
        });

        it('deve retornar erro 400 quando inventarioId está faltando', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    tipoRelatorio: 'geral'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('inventarioId e tipoRelatorio são obrigatórios.');
        });

        it('deve retornar erro 400 para tipo de relatório inválido', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'tipo_invalido'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tipo de relatório inválido');
        });

        it('deve retornar erro 400 para ID de inventário inválido', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: 'id-invalido',
                    tipoRelatorio: 'geral'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID do inventário inválido');
        });

        it('deve retornar erro 400 para ID de sala inválido', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'geral',
                    sala: 'sala-invalida'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID da sala inválido');
        });

        it('deve retornar erro 404 para inventário não encontrado', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5099',
                    tipoRelatorio: 'geral'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Inventário não encontrado');
        });

        it('deve retornar erro 404 para sala não encontrada', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'geral',
                    sala: '655f5e39884c8b76c56a5098'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Sala não encontrada');
        });

        it('deve gerar relatório de bens inserviveis', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'bens_inserviveis'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve gerar relatório de bens ociosos', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'bens_ociosos'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve gerar relatório de bens não encontrados', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'bens_nao_encontrados'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });

        it('deve gerar relatório de bens sem etiqueta', async () => {
            const response = await request(app)
                .get('/relatorios')
                .query({
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: 'bens_sem_etiqueta'
                });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe('application/pdf');
        });
    });
});
