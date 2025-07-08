import { UsuarioSchema, UsuarioUpdateSchema } from '@utils/validators/schemas/zod/UsuarioSchema';

describe('UsuarioSchema', () => {
    const baseDadosValidos = {
        campus: "507f191e810c19729de860ea",
        nome: 'Usuário Teste',
        cpf: '12345678909',
        email: 'usuario@exemplo.com',
        senha: 'Senha@Valida1',
        cargo: 'Comissionado',
    };

    it('analisa dados válidos corretamente e define status como true por padrão', () => {
        const resultado = UsuarioSchema.parse(baseDadosValidos);
        expect(resultado).toEqual({ ...baseDadosValidos, status: true });
    });

    it('remove pontos e traços do CPF durante a validação', () => {
        const input = { ...baseDadosValidos, cpf: '123.456.789-09' };
        const result = UsuarioSchema.parse(input);
        expect(result.cpf).toBe('12345678909');
    });

    it('lança erro quando campos obrigatórios estão ausentes', () => {
        const { nome, ...dadosInvalidos } = baseDadosValidos;
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Required/);
    });

    it('lança erro quando nome é string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, nome: '' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo nome é obrigatório/i);
    });

    it('lança erro quando cpf é inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, cpf: '11111111111' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cpf inválido/i);
    });

    it('lança erro quando email tem formato inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, email: 'usuarioexemplo.com' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/formato de email inválido/i);
    });

    it('permite que senha seja ausente', () => {
        const { senha, ...dadosSemSenha } = baseDadosValidos;
        const resultado = UsuarioSchema.parse(dadosSemSenha);
        expect(resultado.senha).toBeUndefined();
    });

    it('lança erro quando senha não atende aos requisitos', () => {
        const dadosInvalidos = { ...baseDadosValidos, senha: 'senha123' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/senha.*8 caracteres/i);
    });

    it('lança erro quando cargo é inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, cargo: 'Cargo Inexistente' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cargo.*comissionado|funcionario cpalm/i);
    });

    it('lança erro quando campus é inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, campus: 'nao-e-um-objectid' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/objectid/i);
    });
});

describe('UsuarioUpdateSchema', () => {
    it('analisa dados parciais corretamente com status padrão', () => {
        const dadosParciais = { nome: 'Usuário Atualizado Teste' };
        const resultado = UsuarioUpdateSchema.parse(dadosParciais);
        expect(resultado.nome).toBe('Usuário Atualizado Teste');
        expect(resultado.status).toBe(true);
    });

    it('aplica status padrão true quando nenhum dado é fornecido', () => {
        const resultado = UsuarioUpdateSchema.parse({});
        expect(resultado.nome).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('permite atualização de campos específicos', () => {
        const dadosParciais = { email: 'novo@email.com', status: false };
        const resultado = UsuarioUpdateSchema.parse(dadosParciais);
        expect(resultado.email).toBe('novo@email.com');
        expect(resultado.status).toBe(false);
        expect(resultado.nome).toBeUndefined();
    });

    it('lança erro quando nome fornecido é vazio', () => {
        const dadosInvalidos = { nome: '' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/nome.*obrigatório/i);
    });

    it('valida cpf se fornecido e inválido', () => {
        const dadosInvalidos = { cpf: '11111111111' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/cpf inválido/i);
    });

    it('valida email se fornecido e inválido', () => {
        const dadosInvalidos = { email: 'emailinvalido' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/formato de email inválido/i);
    });

    it('valida senha se fornecida e não atende aos requisitos', () => {
        const dadosInvalidos = { senha: 'senha123' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/senha.*8 caracteres/i);
    });

    it('valida cargo se fornecido e inválido', () => {
        const dadosInvalidos = { cargo: 'NaoExisteEsteCargo' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/cargo.*comissionado|funcionario cpalm/i);
    });
});
