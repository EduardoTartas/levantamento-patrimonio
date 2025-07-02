import request from 'supertest';
import express from 'express';
import router from '@routes/levantamentoRoutes';

jest.mock('multer', () => {
    return jest.fn(() => ({
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
});

jest.mock('@middlewares/AuthMiddleware.js', () => {
    return (req, res, next) => {
        req.user = { _id: '655f5e39884c8b76c56a5083', nome: 'Usuario Teste' };
        next();
    };
});

jest.mock('@utils/helpers/index.js', () => ({
    asyncWrapper: (fn) => fn
}));
jest.mock('@controllers/LevantamentoController.js', () => {
    return jest.fn().mockImplementation(() => ({
        listar: (req, res) => {
            const { id } = req.params;
            const { page = 1, limite = 10, inventario, estado, usuario, tombo, nomeBem, ocioso } = req.query;
            
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
                    bemId: '655f5e39884c8b76c56a5085',
                    tombo: 'TOM123',
                    nomeBem: 'Mesa de Escritório',
                    responsavel: 'João Silva',
                    estado: 'Em condições de uso',
                    usuario: { _id: '655f5e39884c8b76c56a5083', nome: 'Usuario Teste' },
                    imagens: [],
                    ocioso: false,
                    createdAt: new Date('2024-01-02'),
                    updatedAt: new Date('2024-01-02')
                },
                {
                    _id: '655f5e39884c8b76c56a5088',
                    inventario: { _id: '655f5e39884c8b76c56a5089', nome: 'Inventário 2' },
                    bemId: '655f5e39884c8b76c56a5090',
                    tombo: 'TOM456',
                    nomeBem: 'Cadeira',
                    responsavel: 'Maria Santos',
                    estado: 'Danificado',
                    usuario: { _id: '655f5e39884c8b76c56a5091', nome: 'Usuario 2' },
                    imagens: ['https://minio.com/foto2.jpg'],
                    ocioso: true,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01')
                }
            ];

            if (inventario) {
                levantamentos = levantamentos.filter(l => l.inventario._id === inventario);
            }
            if (estado) {
                levantamentos = levantamentos.filter(l => l.estado === estado);
            }
            if (usuario) {
                levantamentos = levantamentos.filter(l => l.usuario._id === usuario);
            }
            if (tombo) {
                levantamentos = levantamentos.filter(l => l.tombo.includes(tombo));
            }
            if (nomeBem) {
                levantamentos = levantamentos.filter(l => l.nomeBem.includes(nomeBem));
            }
            if (ocioso !== undefined) {
                const isOcioso = ocioso === 'true';
                levantamentos = levantamentos.filter(l => l.ocioso === isOcioso);
            }

            levantamentos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
                limit: limitNum,
                hasNextPage: endIndex < levantamentos.length,
                hasPrevPage: pageNum > 1
            });
        },

        criar: (req, res) => {
            const { inventario, bemId, estado, observacao, salaNova, ocioso } = req.body;
            
            if (!inventario || !bemId || !estado) {
                return res.status(400).json({ 
                    message: "Campos obrigatórios faltantes",
                    required: ["inventario", "bemId", "estado"]
                });
            }

            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(inventario) || !isValidObjectId(bemId)) {
                return res.status(400).json({ message: "ObjectId inválido" });
            }

            if (salaNova && !isValidObjectId(salaNova)) {
                return res.status(400).json({ message: "ObjectId da sala inválido" });
            }

            const estadosValidos = ['Em condições de uso', 'Inservível', 'Danificado'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({ 
                    message: "Estado inválido",
                    allowedValues: estadosValidos
                });
            }

            if (inventario === '655f5e39884c8b76c56a5092' && bemId === '655f5e39884c8b76c56a5093') {
                return res.status(409).json({ 
                    message: "Já existe levantamento para este bem neste inventário" 
                });
            }

            const novoLevantamento = {
                _id: '655f5e39884c8b76c56a5094',
                inventario: { _id: inventario, nome: 'Inventário Teste' },
                bemId,
                tombo: 'TOM999',
                nomeBem: 'Bem Teste',
                responsavel: 'Responsável Teste',
                estado,
                observacao: observacao || '',
                usuario: { _id: req.user._id, nome: req.user.nome },
                salaNova: salaNova ? { _id: salaNova, nome: 'Sala Nova' } : null,
                imagens: [],
                ocioso: ocioso || false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            return res.status(201).json(novoLevantamento);
        },

        atualizar: (req, res) => {
            const { id } = req.params;
            const updates = req.body;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id === '655f5e39884c8b76c56a5095') {
                return res.status(404).json({ message: "Levantamento não encontrado" });
            }

            if (updates.inventario || updates.bemId) {
                return res.status(400).json({ 
                    message: "Não é possível atualizar inventário ou bemId" 
                });
            }

            if (updates.estado) {
                const estadosValidos = ['Em condições de uso', 'Inservível', 'Danificado'];
                if (!estadosValidos.includes(updates.estado)) {
                    return res.status(400).json({ 
                        message: "Estado inválido",
                        allowedValues: estadosValidos
                    });
                }
            }

            const levantamentoAtualizado = {
                _id: id,
                inventario: { _id: '655f5e39884c8b76c56a5084', nome: 'Inventário Teste' },
                bemId: '655f5e39884c8b76c56a5085',
                tombo: 'TOM123',
                nomeBem: 'Mesa de Escritório',
                responsavel: 'João Silva',
                estado: updates.estado || 'Em condições de uso',
                observacao: updates.observacao || 'Observação original',
                usuario: { _id: '655f5e39884c8b76c56a5083', nome: 'Usuario Teste' },
                salaNova: updates.salaNova ? { _id: updates.salaNova, nome: 'Sala Atualizada' } : null,
                imagens: [],
                ocioso: updates.ocioso !== undefined ? updates.ocioso : false,
                createdAt: new Date('2024-01-01'),
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

            return res.status(200).json({ 
                message: "Levantamento removido com sucesso",
                removedPhotos: 2
            });
        },

        adicionarFoto: (req, res) => {
            const { id } = req.params;
            
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            
            if (!isValidObjectId(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            if (id === '655f5e39884c8b76c56a5095') {
                return res.status(404).json({ message: "Levantamento não encontrado" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Nenhum arquivo enviado" });
            }

            const { mimetype, size } = req.file;
            
            const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!tiposPermitidos.includes(mimetype)) {
                return res.status(400).json({ 
                    message: "Tipo de arquivo inválido",
                    allowedTypes: tiposPermitidos
                });
            }

            const maxSize = 5 * 1024 * 1024;
            if (size > maxSize) {
                return res.status(400).json({ 
                    message: "Arquivo muito grande",
                    maxSize: "5MB"
                });
            }

            const urlFoto = `https://minio.exemplo.com/fotos/${id}/${Date.now()}.jpg`;
            
            return res.status(200).json({
                message: "Foto adicionada com sucesso",
                url: urlFoto,
                totalFotos: 3
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

            if (id === '655f5e39884c8b76c56a5096') {
                return res.status(404).json({ message: "Nenhuma foto encontrada para remover" });
            }

            return res.status(200).json({
                message: "Todas as fotos foram removidas com sucesso",
                removedPhotos: 2
            });
        }
    }));
});

describe('Testes de Rotas /levantamentos', () => {
    const app = express();
    app.use(express.json());
    app.use(router);

    describe('GET /levantamentos - Listar levantamentos', () => {
        it('deve retornar todos os levantamentos com status 200', async () => {
            const response = await request(app).get('/levantamentos');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('docs');
            expect(response.body).toHaveProperty('totalDocs');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('hasNextPage');
            expect(response.body).toHaveProperty('hasPrevPage');
            expect(Array.isArray(response.body.docs)).toBe(true);
        });

        it('deve aplicar filtros corretamente', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({
                    inventario: '655f5e39884c8b76c56a5084',
                    estado: 'Em condições de uso',
                    page: 1,
                    limite: 10
                });
            
            expect(response.status).toBe(200);
            expect(response.body.docs).toHaveLength(1);
            expect(response.body.docs[0].inventario._id).toBe('655f5e39884c8b76c56a5084');
            expect(response.body.docs[0].estado).toBe('Em condições de uso');
        });

        it('deve aplicar filtros avançados corretamente', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({
                    usuario: '655f5e39884c8b76c56a5083',
                    tombo: 'TOM123',
                    nomeBem: 'Mesa',
                    ocioso: 'false'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.docs).toHaveLength(1);
            expect(response.body.docs[0].tombo).toContain('TOM123');
            expect(response.body.docs[0].nomeBem).toContain('Mesa');
            expect(response.body.docs[0].ocioso).toBe(false);
        });

        it('deve implementar paginação corretamente', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({ page: 1, limite: 1 });
            
            expect(response.status).toBe(200);
            expect(response.body.docs).toHaveLength(1);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(1);
            expect(response.body.totalDocs).toBeGreaterThan(0);
        });

        it('deve ordenar por data de criação (mais recentes primeiro)', async () => {
            const response = await request(app).get('/levantamentos');
            
            expect(response.status).toBe(200);
            const docs = response.body.docs;
            if (docs.length > 1) {
                const firstDate = new Date(docs[0].createdAt);
                const secondDate = new Date(docs[1].createdAt);
                expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
            }
        });
    });

    describe('GET /levantamentos/:id - Buscar por ID', () => {
        it('deve retornar levantamento específico com ID válido', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app).get(`/levantamentos/${id}`);
            
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(id);
            expect(response.body).toHaveProperty('inventario');
            expect(response.body).toHaveProperty('usuario');
            expect(response.body).toHaveProperty('tombo');
            expect(response.body).toHaveProperty('nomeBem');
            expect(response.body).toHaveProperty('estado');
        });

        it('deve retornar erro 400 para ID com formato inválido', async () => {
            const idInvalido = '123';
            const response = await request(app).get(`/levantamentos/${idInvalido}`);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });
    });

    describe('POST /levantamentos - Criar levantamento', () => {
        it('deve criar levantamento com dados válidos', async () => {
            const novoLevantamento = {
                inventario: '655f5e39884c8b76c56a5084',
                bemId: '655f5e39884c8b76c56a5085',
                estado: 'Em condições de uso',
                observacao: 'Teste de criação',
                salaNova: '655f5e39884c8b76c56a5086',
                ocioso: false
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(novoLevantamento);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.estado).toBe(novoLevantamento.estado);
            expect(response.body.observacao).toBe(novoLevantamento.observacao);
            expect(response.body.usuario).toHaveProperty('_id');
        });

        it('deve criar levantamento com apenas campos obrigatórios', async () => {
            const dadosMinimos = {
                inventario: '655f5e39884c8b76c56a5084',
                bemId: '655f5e39884c8b76c56a5085',
                estado: 'Em condições de uso'
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(dadosMinimos);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.estado).toBe(dadosMinimos.estado);
        });

        it('deve retornar erro 400 para campos obrigatórios faltantes', async () => {
            const dadosIncompletos = {
                inventario: '655f5e39884c8b76c56a5084'
                // bemId e estado faltando
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(dadosIncompletos);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Campos obrigatórios faltantes');
            expect(response.body.required).toContain('bemId');
            expect(response.body.required).toContain('estado');
        });

        it('deve retornar erro 400 para estado inválido', async () => {
            const dadosInvalidos = {
                inventario: '655f5e39884c8b76c56a5084',
                bemId: '655f5e39884c8b76c56a5085',
                estado: 'Estado Inválido'
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(dadosInvalidos);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Estado inválido');
            expect(response.body.allowedValues).toContain('Em condições de uso');
            expect(response.body.allowedValues).toContain('Inservível');
            expect(response.body.allowedValues).toContain('Danificado');
        });

        it('deve retornar erro 400 para ObjectId inválido', async () => {
            const dadosInvalidos = {
                inventario: 'id-invalido',
                bemId: '655f5e39884c8b76c56a5085',
                estado: 'Em condições de uso'
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(dadosInvalidos);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ObjectId inválido');
        });

        it('deve retornar erro 409 para levantamento duplicado', async () => {
            const levantamentoDuplicado = {
                inventario: '655f5e39884c8b76c56a5092',
                bemId: '655f5e39884c8b76c56a5093',
                estado: 'Em condições de uso'
            };

            const response = await request(app)
                .post('/levantamentos')
                .send(levantamentoDuplicado);
            
            expect(response.status).toBe(409);
            expect(response.body.message).toBe('Já existe levantamento para este bem neste inventário');
        });
    });

    describe('PATCH /levantamentos/:id - Atualizar levantamento', () => {
        it('deve atualizar levantamento com dados válidos', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const atualizacao = {
                estado: 'Danificado',
                observacao: 'Observação atualizada',
                ocioso: true
            };

            const response = await request(app)
                .patch(`/levantamentos/${id}`)
                .send(atualizacao);
            
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(id);
            expect(response.body.estado).toBe(atualizacao.estado);
            expect(response.body.observacao).toBe(atualizacao.observacao);
        });

        it('deve permitir atualização parcial', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const atualizacao = {
                observacao: 'Apenas observação atualizada'
            };

            const response = await request(app)
                .patch(`/levantamentos/${id}`)
                .send(atualizacao);
            
            expect(response.status).toBe(200);
            expect(response.body.observacao).toBe(atualizacao.observacao);
            // Outros campos permanecem inalterados
            expect(response.body.estado).toBe('Em condições de uso');
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            const idInvalido = '123';
            const atualizacao = { observacao: 'Teste' };

            const response = await request(app)
                .patch(`/levantamentos/${idInvalido}`)
                .send(atualizacao);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });

        it('deve retornar erro 404 para levantamento inexistente', async () => {
            const idInexistente = '655f5e39884c8b76c56a5095';
            const atualizacao = { observacao: 'Teste' };

            const response = await request(app)
                .patch(`/levantamentos/${idInexistente}`)
                .send(atualizacao);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });

        it('deve retornar erro 400 ao tentar atualizar inventário ou bemId', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const atualizacaoInvalida = {
                inventario: '655f5e39884c8b76c56a5099',
                bemId: '655f5e39884c8b76c56a5100'
            };

            const response = await request(app)
                .patch(`/levantamentos/${id}`)
                .send(atualizacaoInvalida);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Não é possível atualizar inventário ou bemId');
        });

        it('deve validar estado na atualização', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const atualizacaoInvalida = {
                estado: 'Estado Inválido'
            };

            const response = await request(app)
                .patch(`/levantamentos/${id}`)
                .send(atualizacaoInvalida);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Estado inválido');
        });
    });

    describe('DELETE /levantamentos/:id - Deletar levantamento', () => {
        it('deve deletar levantamento existente', async () => {
            const id = '655f5e39884c8b76c56a5087';

            const response = await request(app)
                .delete(`/levantamentos/${id}`);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Levantamento removido com sucesso');
            expect(response.body).toHaveProperty('removedPhotos');
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            const idInvalido = '123';

            const response = await request(app)
                .delete(`/levantamentos/${idInvalido}`);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });

        it('deve retornar erro 404 para levantamento inexistente', async () => {
            const idInexistente = '655f5e39884c8b76c56a5095';

            const response = await request(app)
                .delete(`/levantamentos/${idInexistente}`);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });
    });

    describe('POST /levantamentos/fotos/:id - Adicionar foto', () => {
        it('deve adicionar foto com arquivo válido', async () => {
            const id = '655f5e39884c8b76c56a5087';

            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`)
                .attach('foto', Buffer.from('fake-image-data'), 'test.jpg');
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Foto adicionada com sucesso');
            expect(response.body).toHaveProperty('url');
            expect(response.body).toHaveProperty('totalFotos');
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            const idInvalido = '123';

            const response = await request(app)
                .post(`/levantamentos/fotos/${idInvalido}`)
                .attach('foto', Buffer.from('fake-image-data'), 'test.jpg');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });

        it('deve retornar erro 404 para levantamento inexistente', async () => {
            const idInexistente = '655f5e39884c8b76c56a5095';

            const response = await request(app)
                .post(`/levantamentos/fotos/${idInexistente}`)
                .attach('foto', Buffer.from('fake-image-data'), 'test.jpg');
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });

        it('deve retornar erro 400 quando nenhum arquivo é enviado', async () => {
            const id = '655f5e39884c8b76c56a5087';

            // Mock do multer sem arquivo
            jest.doMock('multer', () => {
                return jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        req.file = null;
                        next();
                    })
                }));
            });

            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Nenhum arquivo enviado');
        });
    });

    describe('DELETE /levantamentos/fotos/:id - Deletar fotos', () => {
        it('deve deletar todas as fotos do levantamento', async () => {
            const id = '655f5e39884c8b76c56a5087';

            const response = await request(app)
                .delete(`/levantamentos/fotos/${id}`);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Todas as fotos foram removidas com sucesso');
            expect(response.body).toHaveProperty('removedPhotos');
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            const idInvalido = '123';

            const response = await request(app)
                .delete(`/levantamentos/fotos/${idInvalido}`);
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('ID inválido');
        });

        it('deve retornar erro 404 para levantamento inexistente', async () => {
            const idInexistente = '655f5e39884c8b76c56a5095';

            const response = await request(app)
                .delete(`/levantamentos/fotos/${idInexistente}`);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Levantamento não encontrado');
        });

        it('deve retornar erro 404 quando não há fotos para remover', async () => {
            const idSemFotos = '655f5e39884c8b76c56a5096';

            const response = await request(app)
                .delete(`/levantamentos/fotos/${idSemFotos}`);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Nenhuma foto encontrada para remover');
        });
    });

    describe('Validações gerais e edge cases', () => {
        it('deve tratar caracteres especiais nos filtros', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({
                    nomeBem: 'Mesa & Cadeira',
                    tombo: 'TOM-123/2024'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('docs');
        });

        it('deve implementar paginação com limites extremos', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({ page: 999, limite: 1000 });
            
            expect(response.status).toBe(200);
            expect(response.body.page).toBe(999);
            expect(response.body.limit).toBe(1000);
        });

        it('deve retornar metadados de paginação corretos', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({ page: 1, limite: 1 });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalDocs');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body).toHaveProperty('hasNextPage');
            expect(response.body).toHaveProperty('hasPrevPage');
            expect(typeof response.body.hasNextPage).toBe('boolean');
            expect(typeof response.body.hasPrevPage).toBe('boolean');
        });

        it('deve popular dados relacionados corretamente', async () => {
            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app).get(`/levantamentos/${id}`);
            
            expect(response.status).toBe(200);
            expect(response.body.inventario).toHaveProperty('_id');
            expect(response.body.inventario).toHaveProperty('nome');
            expect(response.body.usuario).toHaveProperty('_id');
            expect(response.body.usuario).toHaveProperty('nome');
        });

        it('deve retornar arrays vazios quando não há resultados', async () => {
            const response = await request(app)
                .get('/levantamentos')
                .query({ inventario: '655f5e39884c8b76c56a5999' }); // ID que não existe
            
            expect(response.status).toBe(200);
            expect(response.body.docs).toHaveLength(0);
            expect(response.body.totalDocs).toBe(0);
        });
    });

    describe('Testes de validação de arquivos de upload', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('deve aceitar arquivos JPG válidos', async () => {
            // Mock específico para JPG
            jest.doMock('multer', () => {
                return jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        req.file = {
                            buffer: Buffer.from('fake-jpg-data'),
                            mimetype: 'image/jpeg',
                            originalname: 'test.jpg',
                            size: 1024
                        };
                        next();
                    })
                }));
            });

            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`)
                .attach('foto', Buffer.from('fake-jpg-data'), 'test.jpg');
            
            expect(response.status).toBe(200);
        });

        it('deve aceitar arquivos PNG válidos', async () => {
            // Mock específico para PNG
            jest.doMock('multer', () => {
                return jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        req.file = {
                            buffer: Buffer.from('fake-png-data'),
                            mimetype: 'image/png',
                            originalname: 'test.png',
                            size: 2048
                        };
                        next();
                    })
                }));
            });

            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`)
                .attach('foto', Buffer.from('fake-png-data'), 'test.png');
            
            expect(response.status).toBe(200);
        });

        it('deve rejeitar arquivos PDF', async () => {
            // Mock para arquivo PDF
            jest.doMock('multer', () => {
                return jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        req.file = {
                            buffer: Buffer.from('fake-pdf-data'),
                            mimetype: 'application/pdf',
                            originalname: 'test.pdf',
                            size: 1024
                        };
                        next();
                    })
                }));
            });

            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`)
                .attach('foto', Buffer.from('fake-pdf-data'), 'test.pdf');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Tipo de arquivo inválido');
        });

        it('deve rejeitar arquivos muito grandes', async () => {
            // Mock para arquivo grande
            jest.doMock('multer', () => {
                return jest.fn(() => ({
                    single: jest.fn(() => (req, res, next) => {
                        req.file = {
                            buffer: Buffer.from('fake-large-data'),
                            mimetype: 'image/jpeg',
                            originalname: 'large.jpg',
                            size: 6 * 1024 * 1024 // 6MB
                        };
                        next();
                    })
                }));
            });

            const id = '655f5e39884c8b76c56a5087';
            const response = await request(app)
                .post(`/levantamentos/fotos/${id}`)
                .attach('foto', Buffer.alloc(6 * 1024 * 1024), 'large.jpg');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Arquivo muito grande');
            expect(response.body.maxSize).toBe('5MB');
        });
    });
});
