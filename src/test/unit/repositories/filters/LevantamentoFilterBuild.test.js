import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import LevantamentoFilterBuilder from '@repositories/filters/LevantamentoFilterBuild.js';
import Levantamento from '@models/Levantamento.js';

jest.mock('@models/Levantamento.js');

describe('LevantamentoFilterBuilder', () => {
    let filterBuilder;

    beforeEach(() => {
        jest.clearAllMocks();
        filterBuilder = new LevantamentoFilterBuilder();
    });

    describe('Constructor', () => {
        it('deve criar instância com filtros vazios', () => {
            expect(filterBuilder).toBeInstanceOf(LevantamentoFilterBuilder);
            expect(filterBuilder.filtros).toEqual({});
            expect(filterBuilder.levantamentoModel).toBe(Levantamento);
        });
    });

    describe('comInventario', () => {
        it('deve adicionar filtro de inventário com ObjectId válido', () => {
            const validObjectId = '507f1f77bcf86cd799439011';

            const result = filterBuilder.comInventario(validObjectId);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.inventario).toBe(validObjectId);
        });

        it('deve ignorar inventário com ID inválido', () => {
            const invalidId = 'invalid-id';

            const result = filterBuilder.comInventario(invalidId);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.inventario).toBeUndefined();
        });

        it('deve ignorar inventário vazio ou null', () => {
            expect(filterBuilder.comInventario('').filtros.inventario).toBeUndefined();
            expect(filterBuilder.comInventario(null).filtros.inventario).toBeUndefined();
            expect(filterBuilder.comInventario(undefined).filtros.inventario).toBeUndefined();
        });

        it('deve ignorar inventário com formato incorreto', () => {
            const invalidFormats = [
                '507f1f77bcf86cd79943901',
                '507f1f77bcf86cd799439011g',
                'gggggggggggggggggggggggg',
            ];

            invalidFormats.forEach(invalidId => {
                const builder = new LevantamentoFilterBuilder();
                builder.comInventario(invalidId);
                expect(builder.filtros.inventario).toBeUndefined();
            });
        });
    });

    describe('comEstado', () => {
        it('deve adicionar filtro de estado válido', () => {
            const estadosValidos = ["Em condições de uso", "Inservível", "Danificado"];

            estadosValidos.forEach(estado => {
                const builder = new LevantamentoFilterBuilder();
                
                const result = builder.comEstado(estado);

                expect(result).toBe(builder);
                expect(builder.filtros.estado).toBe(estado);
            });
        });

        it('deve ignorar estado inválido', () => {
            const estadosInvalidos = ["Estado Inválido", "Novo", "", "ativo"];

            estadosInvalidos.forEach(estado => {
                const builder = new LevantamentoFilterBuilder();
                
                builder.comEstado(estado);

                expect(builder.filtros.estado).toBeUndefined();
            });
        });

        it('deve ignorar estado vazio ou null', () => {
            expect(filterBuilder.comEstado('').filtros.estado).toBeUndefined();
            expect(filterBuilder.comEstado(null).filtros.estado).toBeUndefined();
            expect(filterBuilder.comEstado(undefined).filtros.estado).toBeUndefined();
        });
    });

    describe('comUsuario', () => {
        it('deve adicionar filtro de usuário com ObjectId válido', () => {
            const validObjectId = '507f1f77bcf86cd799439011';

            const result = filterBuilder.comUsuario(validObjectId);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.usuario).toBe(validObjectId);
        });

        it('deve ignorar usuário com ID inválido', () => {
            const invalidId = 'invalid-user-id';

            filterBuilder.comUsuario(invalidId);

            expect(filterBuilder.filtros.usuario).toBeUndefined();
        });

        it('deve ignorar usuário vazio ou null', () => {
            expect(filterBuilder.comUsuario('').filtros.usuario).toBeUndefined();
            expect(filterBuilder.comUsuario(null).filtros.usuario).toBeUndefined();
            expect(filterBuilder.comUsuario(undefined).filtros.usuario).toBeUndefined();
        });
    });

    describe('comOcioso', () => {
        it('deve adicionar filtro ocioso true para string "true"', () => {
            const result = filterBuilder.comOcioso("true");

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.ocioso).toBe(true);
        });

        it('deve adicionar filtro ocioso true para boolean true', () => {
            filterBuilder.comOcioso(true);

            expect(filterBuilder.filtros.ocioso).toBe(true);
        });

        it('deve adicionar filtro ocioso false para string "false"', () => {
            filterBuilder.comOcioso("false");

            expect(filterBuilder.filtros.ocioso).toBe(false);
        });

        it('deve adicionar filtro ocioso false para boolean false', () => {
            filterBuilder.comOcioso(false);

            expect(filterBuilder.filtros.ocioso).toBe(false);
        });

        it('deve ignorar valores inválidos para ocioso', () => {
            const valoresInvalidos = ["invalid", "1", "0", null, undefined, "", "TRUE", "FALSE"];

            valoresInvalidos.forEach(valor => {
                const builder = new LevantamentoFilterBuilder();
                builder.comOcioso(valor);
                expect(builder.filtros.ocioso).toBeUndefined();
            });
        });
    });

    describe('comTombo', () => {
        it('deve adicionar filtro de tombo com escape de regex', () => {
            const tombo = 'TOM-123';

            const result = filterBuilder.comTombo(tombo);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros["bem.tombo"]).toBe('TOM\\-123');
        });

        it('deve fazer escape de caracteres especiais no tombo', () => {
            const tomboComEspeciais = 'TOM.123[test]';
            const expectedEscaped = 'TOM\\.123\\[test\\]';

            filterBuilder.comTombo(tomboComEspeciais);

            expect(filterBuilder.filtros["bem.tombo"]).toBe(expectedEscaped);
        });

        it('deve ignorar tombo vazio ou null', () => {
            expect(filterBuilder.comTombo('').filtros["bem.tombo"]).toBeUndefined();
            expect(filterBuilder.comTombo(null).filtros["bem.tombo"]).toBeUndefined();
            expect(filterBuilder.comTombo(undefined).filtros["bem.tombo"]).toBeUndefined();
        });

        it('deve processar tombo com todos os caracteres especiais', () => {
            const tomboComplexo = 'TOM-[123]{test}(abc)*+?.\\^$|#  ';
            const expectedEscaped = 'TOM\\-\\[123\\]\\{test\\}\\(abc\\)\\*\\+\\?\\.\\\\\\^\\$\\|\\#\\ \\ ';

            filterBuilder.comTombo(tomboComplexo);

            expect(filterBuilder.filtros["bem.tombo"]).toBe(expectedEscaped);
        });
    });

    describe('comNomeBem', () => {
        it('deve adicionar filtro regex para nome com múltiplos caracteres', () => {
            const nome = 'Mesa';

            const result = filterBuilder.comNomeBem(nome);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros["bem.nome"]).toEqual({
                $regex: 'Mesa',
                $options: 'i'
            });
        });

        it('deve adicionar filtro regex com início para nome de um caractere', () => {
            const nome = 'M';

            filterBuilder.comNomeBem(nome);

            expect(filterBuilder.filtros["bem.nome"]).toEqual({
                $regex: '^M',
                $options: 'i'
            });
        });

        it('deve fazer escape de caracteres especiais no nome', () => {
            const nomeComEspeciais = 'Mesa.Teste[123]';
            const expectedEscaped = 'Mesa\\.Teste\\[123\\]';

            filterBuilder.comNomeBem(nomeComEspeciais);

            expect(filterBuilder.filtros["bem.nome"]).toEqual({
                $regex: expectedEscaped,
                $options: 'i'
            });
        });

        it('deve ignorar nome vazio ou null', () => {
            expect(filterBuilder.comNomeBem('').filtros["bem.nome"]).toBeUndefined();
            expect(filterBuilder.comNomeBem(null).filtros["bem.nome"]).toBeUndefined();
            expect(filterBuilder.comNomeBem(undefined).filtros["bem.nome"]).toBeUndefined();
        });

        it('deve processar nome com um caractere especial corretamente', () => {
            const nomeEspecial = '.';

            filterBuilder.comNomeBem(nomeEspecial);

            expect(filterBuilder.filtros["bem.nome"]).toEqual({
                $regex: '^\\.',
                $options: 'i'
            });
        });
    });

    describe('escapeRegex', () => {
        it('deve fazer escape de todos os caracteres especiais de regex', () => {
            const textoComEspeciais = '-[]{}()*+?.,\\^$|#  ';
            const expectedEscaped = '\\-\\[\\]\\{\\}\\(\\)\\*\\+\\?\\.\\,\\\\\\^\\$\\|\\#\\ \\ ';

            const result = filterBuilder.escapeRegex(textoComEspeciais);

            expect(result).toBe(expectedEscaped);
        });

        it('deve retornar texto normal inalterado', () => {
            const textoNormal = 'TextoNormal123';

            const result = filterBuilder.escapeRegex(textoNormal);

            expect(result).toBe(textoNormal);
        });

        it('deve processar string vazia', () => {
            const result = filterBuilder.escapeRegex('');

            expect(result).toBe('');
        });
    });

    describe('build', () => {
        it('deve retornar filtros vazios quando nenhum filtro foi adicionado', () => {
            const result = filterBuilder.build();

            expect(result).toEqual({});
        });

        it('deve retornar todos os filtros adicionados', () => {
            const expectedFiltros = {
                inventario: '507f1f77bcf86cd799439011',
                estado: 'Em condições de uso',
                ocioso: true,
                usuario: '507f1f77bcf86cd799439012',
                "bem.tombo": 'TOM\\-123',
                "bem.nome": {
                    $regex: 'Mesa',
                    $options: 'i'
                }
            };

            filterBuilder
                .comInventario('507f1f77bcf86cd799439011')
                .comEstado('Em condições de uso')
                .comOcioso(true)
                .comUsuario('507f1f77bcf86cd799439012')
                .comTombo('TOM-123')
                .comNomeBem('Mesa');

            const result = filterBuilder.build();

            expect(result).toEqual(expectedFiltros);
        });

        it('deve permitir method chaining', () => {
            const result = filterBuilder
                .comInventario('507f1f77bcf86cd799439011')
                .comEstado('Em condições de uso')
                .comOcioso(false)
                .build();

            expect(result).toEqual({
                inventario: '507f1f77bcf86cd799439011',
                estado: 'Em condições de uso',
                ocioso: false
            });
        });

        it('deve ignorar filtros com valores inválidos no build final', () => {
            const result = filterBuilder
                .comInventario('invalid-id')
                .comEstado('Estado Inválido')
                .comOcioso('maybe')
                .comUsuario('507f1f77bcf86cd799439011')
                .build();

            expect(result).toEqual({
                usuario: '507f1f77bcf86cd799439011'
            });
        });
    });

    describe('Casos de uso complexos', () => {
        it('deve construir filtros completos para busca avançada', () => {
            const filtroCompleto = new LevantamentoFilterBuilder()
                .comInventario('507f1f77bcf86cd799439011')
                .comEstado('Danificado')
                .comOcioso(true)
                .comUsuario('507f1f77bcf86cd799439012')
                .comTombo('COMP-2024-001')
                .comNomeBem('Computador Dell')
                .build();

            expect(filtroCompleto).toEqual({
                inventario: '507f1f77bcf86cd799439011',
                estado: 'Danificado',
                ocioso: true,
                usuario: '507f1f77bcf86cd799439012',
                "bem.tombo": 'COMP\\-2024\\-001',
                "bem.nome": {
                    $regex: 'Computador\\ Dell',
                    $options: 'i'
                }
            });
        });

        it('deve permitir reutilização de instância para diferentes filtros', () => {
            const filtro1 = filterBuilder
                .comInventario('507f1f77bcf86cd799439011')
                .comEstado('Em condições de uso')
                .build();

            filterBuilder.filtros = {};

            const filtro2 = filterBuilder
                .comUsuario('507f1f77bcf86cd799439012')
                .comOcioso(false)
                .build();

            expect(filtro1).toEqual({
                inventario: '507f1f77bcf86cd799439011',
                estado: 'Em condições de uso'
            });

            expect(filtro2).toEqual({
                usuario: '507f1f77bcf86cd799439012',
                ocioso: false
            });
        });

        it('deve lidar com combinações válidas e inválidas', () => {
            const filtroMisto = filterBuilder
                .comInventario('507f1f77bcf86cd799439011')
                .comEstado('Estado Inexistente')
                .comOcioso(true)
                .comUsuario('invalid-user')
                .comTombo('TOM-123')
                .comNomeBem('')
                .build();

            expect(filtroMisto).toEqual({
                inventario: '507f1f77bcf86cd799439011',
                ocioso: true,
                "bem.tombo": 'TOM\\-123'
            });
        });
    });
});
