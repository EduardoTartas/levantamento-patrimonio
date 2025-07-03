import { RelatorioQuerySchema } from '@utils/validators/schemas/zod/querys/RelatorioQuerySchema';

describe('RelatorioQuerySchema', () => {
    describe('Validações básicas', () => {
        it('deve validar query válida com campos obrigatórios', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve validar query válida com todos os campos', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_danificados',
                sala: '655f5e39884c8b76c56a5086'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });
    });

    describe('Validação inventarioId', () => {
        it('deve rejeitar quando inventarioId está faltando', () => {
            const query = {
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('inventarioId é obrigatório');
        });

        it('deve rejeitar inventarioId vazio', () => {
            const query = {
                inventarioId: '',
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('inventarioId é obrigatório');
        });

        it('deve rejeitar inventarioId com formato inválido', () => {
            const query = {
                inventarioId: 'id-invalido',
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('inventarioId deve ser um ObjectId válido');
        });
    });

    describe('Validação tipoRelatorio', () => {
        it('deve rejeitar quando tipoRelatorio está faltando', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('tipoRelatorio é obrigatório');
        });

        it('deve rejeitar tipoRelatorio vazio', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: ''
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('tipoRelatorio é obrigatório');
        });

        it('deve aceitar tipo geral', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar tipo bens_danificados', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_danificados'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar tipo bens_inserviveis', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_inserviveis'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar tipo bens_ociosos', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_ociosos'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar tipo bens_nao_encontrados', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_nao_encontrados'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar tipo bens_sem_etiqueta', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_sem_etiqueta'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar tipo inválido', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'tipo_invalido'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('Tipo de relatório inválido');
        });
    });

    describe('Validação sala (opcional)', () => {
        it('deve aceitar query sem sala', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve aceitar sala válida', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral',
                sala: '655f5e39884c8b76c56a5086'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar sala com formato inválido', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral',
                sala: 'sala-invalida'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe('sala deve ser um ObjectId válido');
        });

        it('deve aceitar sala vazia (undefined)', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral',
                sala: undefined
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });
    });

    describe('Validações de combinações', () => {
        it('deve validar todas as combinações de tipos válidos', () => {
            const tipos = [
                'geral',
                'bens_danificados',
                'bens_inserviveis', 
                'bens_ociosos',
                'bens_nao_encontrados',
                'bens_sem_etiqueta'
            ];

            tipos.forEach(tipo => {
                const query = {
                    inventarioId: '655f5e39884c8b76c56a5084',
                    tipoRelatorio: tipo,
                    sala: '655f5e39884c8b76c56a5086'
                };

                const result = RelatorioQuerySchema.safeParse(query);
                expect(result.success).toBe(true);
            });
        });

        it('deve rejeitar quando ambos campos obrigatórios estão faltando', () => {
            const query = {
                sala: '655f5e39884c8b76c56a5086'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues).toHaveLength(2);
        });
    });

    describe('Casos extremos', () => {
        it('deve validar ObjectIds no limite de tamanho', () => {
            const query = {
                inventarioId: '507f1f77bcf86cd799439011',
                tipoRelatorio: 'geral',
                sala: '507f1f77bcf86cd799439012'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar campos extras não definidos', () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral',
                campoExtra: 'valor'
            };

            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].code).toBe('unrecognized_keys');
        });
    });
});
