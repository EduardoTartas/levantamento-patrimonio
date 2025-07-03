import RelatorioController from '@controllers/RelatorioController';
import RelatorioService from '@services/RelatorioService';
import { RelatorioQuerySchema } from '@utils/validators/schemas/zod/querys/RelatorioQuerySchema';

jest.mock('@services/RelatorioService');
jest.mock('@utils/validators/schemas/zod/querys/RelatorioQuerySchema', () => ({
    RelatorioQuerySchema: {
        parseAsync: jest.fn()
    }
}));

describe('RelatorioController', () => {
    let controller;
    let mockService;
    let req;
    let res;

    beforeEach(() => {
        mockService = {
            gerarRelatorio: jest.fn()
        };
        RelatorioService.mockImplementation(() => mockService);
        
        controller = new RelatorioController();
        
        req = {
            query: {}
        };
        
        res = {
            setHeader: jest.fn(),
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('gerar', () => {
        it('deve gerar relatório com sucesso', async () => {
            const mockPdfBuffer = Buffer.from('fake-pdf-content');
            req.query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            RelatorioQuerySchema.parseAsync.mockResolvedValue(req.query);
            mockService.gerarRelatorio.mockResolvedValue(mockPdfBuffer);

            await controller.gerar(req, res);

            expect(RelatorioQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
            expect(mockService.gerarRelatorio).toHaveBeenCalledWith(req.query);
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=relatorio.pdf');
            expect(res.send).toHaveBeenCalledWith(mockPdfBuffer);
        });

        it('deve gerar relatório com filtro de sala', async () => {
            const mockPdfBuffer = Buffer.from('fake-pdf-content');
            req.query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_danificados',
                sala: '655f5e39884c8b76c56a5086'
            };

            RelatorioQuerySchema.parseAsync.mockResolvedValue(req.query);
            mockService.gerarRelatorio.mockResolvedValue(mockPdfBuffer);

            await controller.gerar(req, res);

            expect(RelatorioQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
            expect(mockService.gerarRelatorio).toHaveBeenCalledWith(req.query);
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(res.send).toHaveBeenCalledWith(mockPdfBuffer);
        });

        it('deve não validar quando query está vazia', async () => {
            const mockPdfBuffer = Buffer.from('fake-pdf-content');
            req.query = {};

            mockService.gerarRelatorio.mockResolvedValue(mockPdfBuffer);

            await controller.gerar(req, res);

            expect(RelatorioQuerySchema.parseAsync).not.toHaveBeenCalled();
            expect(mockService.gerarRelatorio).toHaveBeenCalledWith({});
        });

        it('deve definir headers corretos para PDF', async () => {
            const mockPdfBuffer = Buffer.from('fake-pdf-content');
            req.query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'bens_ociosos'
            };

            RelatorioQuerySchema.parseAsync.mockResolvedValue(req.query);
            mockService.gerarRelatorio.mockResolvedValue(mockPdfBuffer);

            await controller.gerar(req, res);

            expect(res.setHeader).toHaveBeenCalledTimes(2);
            expect(res.setHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'application/pdf');
            expect(res.setHeader).toHaveBeenNthCalledWith(2, 'Content-Disposition', 'attachment; filename=relatorio.pdf');
        });

        it('deve validar query quando não está vazia', async () => {
            const mockPdfBuffer = Buffer.from('fake-pdf-content');
            req.query = {
                inventarioId: '655f5e39884c8b76c56a5084',
                tipoRelatorio: 'geral'
            };

            RelatorioQuerySchema.parseAsync.mockResolvedValue(req.query);
            mockService.gerarRelatorio.mockResolvedValue(mockPdfBuffer);

            await controller.gerar(req, res);

            expect(RelatorioQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
        });
    });
});
