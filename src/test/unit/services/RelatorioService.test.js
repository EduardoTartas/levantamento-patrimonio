import RelatorioService from '@services/RelatorioService';
import InventarioService from '@services/InventarioService';
import SalaService from '@services/SalaService';
import Levantamento from '@models/Levantamento';
import { CustomError } from '@utils/helpers/index';

jest.mock('@services/InventarioService');
jest.mock('@services/SalaService');
jest.mock('@models/Levantamento');
jest.mock('pdfkit', () => {
    return jest.fn().mockImplementation(() => ({
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        fillColor: jest.fn().mockReturnThis(),
        strokeColor: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        x: 50,
        y: 100,
        page: {
            width: 612,
            height: 792
        },
        on: jest.fn((event, callback) => {
            if (event === 'end') {
                setTimeout(() => callback(), 0);
            } else if (event === 'data') {
                setTimeout(() => callback(Buffer.from('pdf-chunk')), 0);
            }
        }),
        end: jest.fn()
    }));
});

describe('RelatorioService', () => {
    let service;
    let mockInventarioService;
    let mockSalaService;

    beforeEach(() => {
        mockInventarioService = {
            ensureInvExists: jest.fn()
        };
        mockSalaService = {
            ensureSalaExists: jest.fn()
        };

        InventarioService.mockImplementation(() => mockInventarioService);
        SalaService.mockImplementation(() => mockSalaService);

        service = new RelatorioService();

        const mockLevantamentoQuery = {
            find: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn()
        };
        Levantamento.find = jest.fn(() => mockLevantamentoQuery);
        Levantamento.find().populate().populate.mockReturnValue(mockLevantamentoQuery);
        Levantamento.find().populate().populate().lean.mockResolvedValue([]);

        jest.clearAllMocks();
    });

    describe('gerarRelatorio', () => {
        test('deve gerar relatório geral com sucesso', async () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            const mockLevantamentos = [
                {
                    _id: '655f5e39884c8b76c56a5087',
                    bem: { tombo: 'TOM123', nome: 'Mesa' },
                    estado: 'Em condições de uso',
                    ocioso: false
                }
            ];

            Levantamento.find().populate().populate().lean.mockResolvedValue(mockLevantamentos);

            const result = await service.gerarRelatorio(query);

            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(query.inventarioId);
            expect(mockSalaService.ensureSalaExists).not.toHaveBeenCalled();
            expect(Buffer.isBuffer(result)).toBe(true);
        });

        test('deve gerar relatório com filtro de sala', async () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral',
                sala: '655f5e39884c8b76c56a5086'
            };

            await service.gerarRelatorio(query);

            expect(mockInventarioService.ensureInvExists).toHaveBeenCalledWith(query.inventarioId);
            expect(mockSalaService.ensureSalaExists).toHaveBeenCalledWith(query.sala);
        });

        test('deve lançar erro quando inventarioId está faltando', async () => {
            const query = {
                tipoRelatorio: 'geral'
            };

            await expect(service.gerarRelatorio(query)).rejects.toThrow(CustomError);
        });

        test('deve lançar erro quando tipoRelatorio está faltando', async () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084'
            };

            await expect(service.gerarRelatorio(query)).rejects.toThrow(CustomError);
        });

        test('deve gerar relatórios específicos por tipo', async () => {
            const inventarioId = '655f5e39884c8b76c56a5084';
            const tipos = [
                { tipo: 'bens_danificados', filtro: { estado: 'Danificado' } },
                { tipo: 'bens_inserviveis', filtro: { estado: 'Inservível' } },
                { tipo: 'bens_ociosos', filtro: { ocioso: true } },
                { tipo: 'bens_nao_encontrados', filtro: { ocioso: false } },
                { tipo: 'bens_sem_etiqueta', filtro: { 'bem.tombo': { $in: [null, ''] } } }
            ];

            for (const { tipo, filtro } of tipos) {
                const query = { inventarioId, tipoRelatorio: tipo };
                await service.gerarRelatorio(query);
                expect(Levantamento.find).toHaveBeenCalledWith({ inventario: inventarioId, ...filtro });
            }
        });

        test('deve aplicar filtro de sala quando fornecido', async () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_danificados',
                sala: '655f5e39884c8b76c56a5086'
            };

            await service.gerarRelatorio(query);

            expect(Levantamento.find).toHaveBeenCalledWith({
                inventario: query.inventarioId,
                estado: 'Danificado',
                'bem.salaId': query.sala
            });
        });

        test('deve lançar erro para tipo de relatório inválido', async () => {
            const query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'tipo_invalido'
            };

            await expect(service.gerarRelatorio(query)).rejects.toThrow(CustomError);
        });
    });

    describe('_buscarLevantamentos', () => {
        test('deve buscar levantamentos com filtro básico', async () => {
            const params = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            await service._buscarLevantamentos(params);

            expect(Levantamento.find).toHaveBeenCalledWith({
                inventario: params.inventarioId
            });
        });

        test('deve popular campos relacionados', async () => {
            const params = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            const mockQuery = {
                find: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            };

            Levantamento.find = jest.fn(() => mockQuery);

            await service._buscarLevantamentos(params);

            expect(mockQuery.populate).toHaveBeenCalledWith('salaNova', 'nome');
            expect(mockQuery.populate).toHaveBeenCalledWith('usuario', 'nome');
            expect(mockQuery.lean).toHaveBeenCalled();
        });

        test('deve lançar erro para tipo de relatório não suportado', async () => {
            const params = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'tipo_nao_suportado'
            };

            await expect(service._buscarLevantamentos(params)).rejects.toThrow(CustomError);
        });
    });

    describe('_gerarPDF', () => {
        test('deve gerar PDF com levantamentos', async () => {
            const levantamentos = [
                {
                    bem: { tombo: 'TOM123', nome: 'Mesa' },
                    estado: 'Em condições de uso'
                }
            ];

            const result = await service._gerarPDF(levantamentos, 'geral');

            expect(Buffer.isBuffer(result)).toBe(true);
        });

        test('deve gerar PDF vazio quando não há levantamentos', async () => {
            const levantamentos = [];

            const result = await service._gerarPDF(levantamentos, 'geral');

            expect(Buffer.isBuffer(result)).toBe(true);
        });
    });
});
