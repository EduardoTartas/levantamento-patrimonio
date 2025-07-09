import request from 'supertest';
import express from 'express';
import router from '@routes/levantamentoRoutes';

jest.mock('multer', () => {
    const multer = jest.fn(() => ({
        single: jest.fn(() => (req, res, next) => {
            req.file = {
                buffer: Buffer.from('fake-image-data'),
                mimetype: 'image/jpeg',
                originalname: 'test.jpg',
                size: 1024
            };
            next();
        })
    }));
    multer.memoryStorage = jest.fn(() => ({}));
    return multer;
});

jest.mock('@middlewares/AuthMiddleware.js', () => (req, res, next) => {
    req.user = { _id: 'testuser', id: 'testuser' };
    next();
});

jest.mock('@middlewares/AuthPermission.js', () => (req, res, next) => {
    next();
});

jest.mock('@utils/helpers/index.js', () => ({
    asyncWrapper: (fn) => fn
}));

jest.mock('@controllers/LevantamentoController.js', () => {
    return jest.fn().mockImplementation(() => ({
        listar: (req, res) => {
            const { id } = req.params;
            const { page = 1, limite = 10, estado } = req.query;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (id && !isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id) {
                const levantamento = {
                    _id: id,
                    inventario: { _id: '655f5e39884c8b76c56a5084', nome: 'Inventário Teste' },
                    bemId: '655f5e39884c8b76c56a5085',
                    tombo: 'TOM123',
                    nomeBem: 'Mesa de Escritório',
                    responsavel: 'João Silva',
                    estado: 'Em condições de uso',
                    observacao: 'Teste',
                    usuario: { _id: '655f5e39884c8b76c56a5083', nome: 'Usuario Teste' },
                    salaNova: { _id: '655f5e39884c8b76c56a5086', nome: 'Sala 101' },
                    imagens: ['https://minio.com/foto1.jpg'],
                    ocioso: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                return res.status(200).json(levantamento);
            }

            let levantamentos = [
                {
                    _id: '655f5e39884c8b76c56a5087',
                    inventario: { _id: '655f5e39884c8b76c56a5084', nome: 'Inventário Teste' },
                    tombo: 'TOM123',
                    nomeBem: 'Mesa de Escritório',
                    estado: 'Em condições de uso',
                    usuario: { _id: '655f5e39884c8b76c56a5083', nome: 'Usuario Teste' },
                    ocioso: false,
                    createdAt: new Date('2024-01-02')
                },
                {
                    _id: '655f5e39884c8b76c56a5088',
                    inventario: { _id: '655f5e39884c8b76c56a5089', nome: 'Inventário 2' },
                    tombo: 'TOM456',
                    nomeBem: 'Cadeira',
                    estado: 'Danificado',
                    usuario: { _id: '655f5e39884c8b76c56a5091', nome: 'Usuario 2' },
                    ocioso: true,
                    createdAt: new Date('2024-01-01')
                }
            ];

            if (estado) {
                levantamentos = levantamentos.filter(l => l.estado === estado);
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limite);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const paginatedResults = levantamentos.slice(startIndex, endIndex);

            return res.status(200).json({
                docs: paginatedResults,
                totalDocs: levantamentos.length,
                totalPages: Math.ceil(levantamentos.length / limitNum),
                page: pageNum,
                limit: limitNum
            });
        },

        criar: (req, res) => {
            const { inventario, bemId, estado } = req.body;
            
            if (!inventario || !bemId || !estado) {
                return res.status(400).json({ 
                    message: "Campos obrigatórios faltantes"
                });
            }

            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(inventario) || !isValidObjectId(bemId)) {
                return res.status(400).json({ message: "ObjectId inválido" });
            }

            const estadosValidos = ['Em condições de uso', 'Inservível', 'Danificado'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({ message: "Estado inválido" });
            }

            const novoLevantamento = {
                _id: '655f5e39884c8b76c56a5094',
                inventario: { _id: inventario, nome: 'Inventário Teste' },
                bemId,
                estado,
                usuario: { _id: req.user._id, nome: req.user.nome },
                createdAt: new Date()
            };

            return res.status(201).json(novoLevantamento);
        },

        atualizar: (req, res) => {
            const { id } = req.params;
            const { estado } = req.body;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id === '655f5e39884c8b76c56a5095') {
                return res.status(404).json({ message: "Levantamento não encontrado" });
            }

            const levantamentoAtualizado = {
                _id: id,
                estado: estado || 'Em condições de uso',
                updatedAt: new Date()
            };

            return res.status(200).json(levantamentoAtualizado);
        },

        deletar: (req, res) => {
            const { id } = req.params;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id === '655f5e39884c8b76c56a5095') {
                return res.status(404).json({ message: "Levantamento não encontrado" });
            }

            return res.status(200).json({ message: "Levantamento removido com sucesso" });
        },

        adicionarFoto: (req, res) => {
            const { id } = req.params;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Nenhum arquivo enviado" });
            }

            const { mimetype, size } = req.file;
            
            const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!tiposPermitidos.includes(mimetype)) {
                return res.status(400).json({ message: "Tipo de arquivo inválido" });
            }

            const maxSize = 5 * 1024 * 1024;
            if (size > maxSize) {
                return res.status(400).json({ message: "Arquivo muito grande" });
            }

            return res.status(200).json({
                message: "Foto adicionada com sucesso",
                url: `https://minio.exemplo.com/fotos/${id}/${Date.now()}.jpg`
            });
        },

        deletarFoto: (req, res) => {
            const { id } = req.params;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id === '655f5e39884c8b76c56a5095') {
                return res.status(404).json({ message: "Levantamento não encontrado" });
            }

            return res.status(200).json({
                message: "Todas as fotos foram removidas com sucesso"
            });
        }
    }));
});

describe('Testes de Rotas /levantamentos', () => {
    const app = express();
    app.use(express.json());
    app.use(router);

    describe('GET /levantamentos', () => {
        it('deve retornar todos os levantamentos', async () => {
            const response = await request(app).get('/levantamentos');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('docs');
            expect(response.body).toHaveProperty('totalDocs');
            expect(Array.isArray(response.body.docs)).toBe(true);
        });

        it('deve aplicar filtros', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({ estado: 'Em condições de uso' });
            
            expect(response.status).toBe(200);
            expect(response.body.docs[0].estado).toBe('Em condições de uso');
        });
    });

    describe('GET /levantamentos/:id', () => {
        it('deve retornar levantamento por ID', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app).get(`/levantamentos/${id}`);
            
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(id);
        });

        it('deve retornar erro para ID inválido', async () => {
            const response = await request(app).get('/levantamentos/123');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });
    });

    describe('POST /levantamentos', () => {
        it('deve criar levantamento', async () => {
            const novoLevantamento = {
                inventario: '655f5e39884c8b76c56a5084',
                bemId: '655f5e39884c8b76c56a5085',
                estado: 'Em condições de uso'
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(novoLevantamento);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
        });

        it('deve retornar erro para campos obrigatórios faltantes', async () => {
            const response = await request(app)
                .post('/levantamentos')
                .send({ inventario: '655f5e39884c8b76c56a5084' });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Campos obrigatórios faltantes');
        });

        it('deve retornar erro para estado inválido', async () => {
            const response = await request(app)
                .post('/levantamentos')
                .send({
                    inventario: '655f5e39884c8b76c56a5084',
                    bemId: '655f5e39884c8b76c56a5085',
                    estado: 'Estado Inválido'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Estado inválido');
        });
    });

    describe('PATCH /levantamentos/:id', () => {
        it('deve atualizar levantamento', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app)
                .patch(`/levantamentos/${id}`)
                .send({ estado: 'Danificado' });
            
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(id);
        });

        it('deve retornar erro para levantamento inexistente', async () => {
            const response = await request(app)
                .patch('/levantamentos/655f5e39884c8b76c56a5095')
                .send({ estado: 'Danificado' });
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });
    });

    describe('DELETE /levantamentos/:id', () => {
        it('deve deletar levantamento', async () => {
            const response = await request(app)
                .delete('/levantamentos/655f5e39884c8b76c56a5087');
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Levantamento removido com sucesso');
        });

        it('deve retornar erro para levantamento inexistente', async () => {
            const response = await request(app)
                .delete('/levantamentos/655f5e39884c8b76c56a5095');
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });
    });

    describe('POST /levantamentos/fotos/:id', () => {
        it('deve adicionar foto', async () => {
            const response = await request(app)
                .post('/levantamentos/fotos/655f5e39884c8b76c56a5087')
                .attach('foto', Buffer.from('fake-image-data'), 'test.jpg');
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Foto adicionada com sucesso');
        });

        it('deve retornar erro quando arquivo não é enviado', async () => {
            const originalMulter = require('multer');
            jest.doMock('multer', () => {
                const multer = jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        next();
                    })
                }));
                multer.memoryStorage = jest.fn(() => ({}));
                return multer;
            });
            
            jest.resetModules();
            const routerModule = await import('@routes/levantamentoRoutes');
            const routerNoFile = routerModule.default;
            
            const appNoFile = express();
            appNoFile.use(express.json());
            appNoFile.use(routerNoFile);

            const response = await request(appNoFile)
                .post('/levantamentos/fotos/655f5e39884c8b76c56a5087');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Nenhum arquivo enviado');
        });
    });

    describe('DELETE /levantamentos/fotos/:id', () => {
        it('deve deletar fotos do levantamento', async () => {
            const response = await request(app)
                .delete('/levantamentos/fotos/655f5e39884c8b76c56a5087');
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Todas as fotos foram removidas com sucesso');
        });

        it('deve retornar erro para levantamento inexistente', async () => {
            const response = await request(app)
                .delete('/levantamentos/fotos/655f5e39884c8b76c56a5095');
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });
    });
});
