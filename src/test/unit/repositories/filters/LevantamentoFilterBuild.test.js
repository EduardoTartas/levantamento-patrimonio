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

    describe('comInventario', () => {
        it('deve adicionar filtro de inventário com ObjectId válido', () => {
            const validObjectId = '507f1f77bcf86cd799439011';
            const result = filterBuilder.comInventario(validObjectId);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.inventario).toBe(validObjectId);
        });

        it('deve ignorar inventário com ID inválido ou vazio', () => {
            filterBuilder.comInventario('invalid-id');
            expect(filterBuilder.filtros.inventario).toBeUndefined();

            filterBuilder.comInventario('');
            expect(filterBuilder.filtros.inventario).toBeUndefined();

            filterBuilder.comInventario(null);
            expect(filterBuilder.filtros.inventario).toBeUndefined();
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

        it('deve ignorar estado inválido ou vazio', () => {
            filterBuilder.comEstado('Estado Inválido');
            expect(filterBuilder.filtros.estado).toBeUndefined();

            filterBuilder.comEstado('');
            expect(filterBuilder.filtros.estado).toBeUndefined();

            filterBuilder.comEstado(null);
            expect(filterBuilder.filtros.estado).toBeUndefined();
        });
    });

    describe('comUsuario', () => {
        it('deve adicionar filtro de usuário com ObjectId válido', () => {
            const validObjectId = '507f1f77bcf86cd799439011';
            const result = filterBuilder.comUsuario(validObjectId);

            expect(result).toBe(filterBuilder);
            expect(filterBuilder.filtros.usuario).toBe(validObjectId);
        });

        it('deve ignorar usuário com ID inválido ou vazio', () => {
            filterBuilder.comUsuario('invalid-user-id');
            expect(filterBuilder.filtros.usuario).toBeUndefined();

            filterBuilder.comUsuario('');
            expect(filterBuilder.filtros.usuario).toBeUndefined();

            filterBuilder.comUsuario(null);
            expect(filterBuilder.filtros.usuario).toBeUndefined();
        });
    });

    describe('comOcioso', () => {
        it('deve adicionar filtro ocioso true para string "true" ou boolean true', () => {
            filterBuilder.comOcioso("true");
            expect(filterBuilder.filtros.ocioso).toBe(true);

            filterBuilder.comOcioso(true);
            expect(filterBuilder.filtros.ocioso).toBe(true);
        });

        it('deve adicionar filtro ocioso false para string "false" ou boolean false', () => {
            filterBuilder.comOcioso("false");
            expect(filterBuilder.filtros.ocioso).toBe(false);

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
            filterBuilder.comTombo('');
            expect(filterBuilder.filtros["bem.tombo"]).toBeUndefined();

            filterBuilder.comTombo(null);
            expect(filterBuilder.filtros["bem.tombo"]).toBeUndefined();
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
            filterBuilder.comNomeBem('');
            expect(filterBuilder.filtros["bem.nome"]).toBeUndefined();

            filterBuilder.comNomeBem(null);
            expect(filterBuilder.filtros["bem.nome"]).toBeUndefined();
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
});
