import { RelatorioQuerySchema } from '@utils/validators/schemas/zod/querys/RelatorioQuerySchema';

describe('RelatorioQuerySchema', () => {
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

    it('deve rejeitar quando inventarioId está faltando ou vazio', () => {
        expect(RelatorioQuerySchema.safeParse({ tipoRelatorio: 'geral' }).success).toBe(false);
        expect(RelatorioQuerySchema.safeParse({ inventarioId: '', tipoRelatorio: 'geral' }).success).toBe(false);
    });

    it('deve rejeitar inventarioId com formato inválido', () => {
        const query = {
            inventarioId: 'invalid-id',
            tipoRelatorio: 'geral'
        };

        const result = RelatorioQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
    });

    it('deve rejeitar quando tipoRelatorio está faltando', () => {
        const query = {
            inventarioId: '655f5e39884c8b76c56a5084'
        };

        const result = RelatorioQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
    });

    it('deve rejeitar tipoRelatorio inválido', () => {
        const query = {
            inventarioId: '655f5e39884c8b76c56a5084',
            tipoRelatorio: 'tipo_inexistente'
        };

        const result = RelatorioQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
    });

    it('deve aceitar todos os tipos de relatório válidos', () => {
        const tiposValidos = ['geral', 'bens_danificados', 'bens_inserviveis', 'bens_ociosos', 'bens_nao_encontrados', 'bens_sem_etiqueta'];
        const inventarioId = '655f5e39884c8b76c56a5084';

        tiposValidos.forEach(tipo => {
            const query = { inventarioId, tipoRelatorio: tipo };
            const result = RelatorioQuerySchema.safeParse(query);
            expect(result.success).toBe(true);
        });
    });

    it('deve rejeitar sala com formato inválido', () => {
        const query = {
            inventarioId: '655f5e39884c8b76c56a5084',
            tipoRelatorio: 'geral',
            sala: 'invalid-sala-id'
        };

        const result = RelatorioQuerySchema.safeParse(query);
        expect(result.success).toBe(false);
    });

    it('deve aceitar sala como opcional', () => {
        const query = {
            inventarioId: '655f5e39884c8b76c56a5084',
            tipoRelatorio: 'geral'
        };

        const result = RelatorioQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        expect(result.data.sala).toBeUndefined();
    });

    it('deve validar todas as combinações de tipos válidos com sala', () => {
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
