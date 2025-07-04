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

    it('analisa dados válidos corretamente (com status explícito)', () => {
        const dadosValidosComStatus = { ...baseDadosValidos, status: true };
        const resultado = UsuarioSchema.parse(dadosValidosComStatus);
        expect(resultado).toEqual(dadosValidosComStatus);
    });

    it('analisa dados válidos corretamente e define "status" como true por padrão', () => {
        const resultado = UsuarioSchema.parse(baseDadosValidos);
        expect(resultado).toEqual({ ...baseDadosValidos, status: true });
    });

    it('remove pontos e traços do CPF durante a validação', () => {
        const input = { ...baseDadosValidos, cpf: '123.456.789-09' };
        const result = UsuarioSchema.parse(input);
        expect(result.cpf).toBe('12345678909'); // sem pontos ou traços
    });

    // --- Testes para o campo "nome" ---
    it('lança um erro quando "nome" está ausente (undefined)', () => {
        const { nome, ...dadosInvalidos } = baseDadosValidos;
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Required/);
    });

    it('lança um erro quando "nome" é uma string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, nome: '' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo nome é obrigatório/i);
    });

    // --- Testes para o campo "cpf" ---
    it('lança um erro quando "cpf" está ausente (undefined)', () => {
        const { cpf, ...dadosInvalidos } = baseDadosValidos;
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Required/);
    });

    it('lança um erro quando "cpf" é uma string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, cpf: '' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo CPF é obrigatório/i);
    });

    it('lança um erro quando "cpf" tem menos de 11 dígitos (após remover pontuação)', () => {
        const dadosInvalidos = { ...baseDadosValidos, cpf: '123.456.789-0' }; // 10 dígitos
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cpf.*11 dígitos/i);
    });

    it('lança um erro quando "cpf" contém não numéricos (após remover pontuação)', () => {
        const dadosInvalidos = { ...baseDadosValidos, cpf: '1234567890a' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cpf.*11 dígitos/i);
    });

    it('lança um erro quando "cpf" é inválido (dígitos verificadores)', () => {
        const dadosInvalidos = { ...baseDadosValidos, cpf: '11111111111' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cpf inválido/i);
    });

    // --- Testes para o campo "email" ---
    it('lança um erro quando "email" está ausente (undefined)', () => {
        const { email, ...dadosInvalidos } = baseDadosValidos;
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Required/);
    });

    it('lança um erro quando "email" é uma string vazia', () => {
        const dadosInvalidos = { ...baseDadosValidos, email: '' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo email é obrigatório/i);
    });

    it('lança um erro quando "email" está em um formato inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, email: 'usuarioexemplo.com' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/formato de email inválido/i);
    });

    // --- Testes para o campo "senha" ---
    it('permite que "senha" seja ausente (opcional)', () => {
        const { senha, ...dadosSemSenha } = baseDadosValidos;
        const resultado = UsuarioSchema.parse(dadosSemSenha);
        expect(resultado.senha).toBeUndefined();
    });

    it('lança um erro quando "senha" é fornecida mas não atende aos requisitos de complexidade', () => {
        const dadosInvalidos = { ...baseDadosValidos, senha: 'senha123' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/senha.*8 caracteres/i);
    });

    // --- Testes para o campo "cargo" ---
    it('lança um erro quando "cargo" está ausente (undefined)', () => {
        const { cargo, ...dadosInvalidos } = baseDadosValidos;
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cargo.*comissionado|funcionario cpalm/i);
    });

    it('lança um erro quando "cargo" é inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, cargo: 'Cargo Inexistente' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/cargo.*comissionado|funcionario cpalm/i);
    });

    // --- Testes para o campo "campus" ---
    it('lança um erro quando "campus" é inválido', () => {
        const dadosInvalidos = { ...baseDadosValidos, campus: 'nao-e-um-objectid' };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/objectid/i);
    });
});

describe('UsuarioUpdateSchema', () => {
    it('analisa dados parciais corretamente (nome e status padrão)', () => {
        const dadosParciais = { nome: 'Usuário Atualizado Teste' };
        const resultado = UsuarioUpdateSchema.parse(dadosParciais);
        expect(resultado.nome).toBe('Usuário Atualizado Teste');
        expect(resultado.cpf).toBeUndefined();
        expect(resultado.email).toBeUndefined();
        expect(resultado.senha).toBeUndefined();
        expect(resultado.cargo).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('aplica status padrão true quando nenhum dado de status é fornecido para atualização', () => {
        const resultado = UsuarioUpdateSchema.parse({});
        expect(resultado.nome).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('permite atualização de campos específicos, mantendo outros como undefined e status com default', () => {
        const dadosParciais = { email: 'novo@email.com', status: false };
        const resultado = UsuarioUpdateSchema.parse(dadosParciais);
        expect(resultado.email).toBe('novo@email.com');
        expect(resultado.status).toBe(false);
        expect(resultado.nome).toBeUndefined();
    });

    it('lança um erro quando "nome" for fornecido mas vazio', () => {
        const dadosInvalidos = { nome: '' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/nome.*obrigatório/i);
    });

    it('valida "cpf" se fornecido e inválido (curto)', () => {
        const dadosInvalidos = { cpf: '123' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/cpf.*11 dígitos/i);
    });

    it('valida "cpf" se fornecido e inválido (verificador)', () => {
        const dadosInvalidos = { cpf: '11111111111' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/cpf inválido/i);
    });

    it('valida "email" se fornecido e inválido', () => {
        const dadosInvalidos = { email: 'emailinvalido' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/formato de email inválido/i);
    });

    it('valida "senha" se fornecida e não atende aos requisitos', () => {
        const dadosInvalidos = { senha: 'senha123' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/senha.*8 caracteres/i);
    });

    it('permite que "senha" seja undefined (não atualiza)', () => {
        const dadosValidos = { nome: 'Nome Novo', senha: undefined };
        const resultado = UsuarioUpdateSchema.parse(dadosValidos);
        expect(resultado.senha).toBeUndefined();
    });

    it('valida "cargo" se fornecido e inválido', () => {
        const dadosInvalidos = { cargo: 'NaoExisteEsteCargo' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/cargo.*comissionado|funcionario cpalm/i);
    });
});
