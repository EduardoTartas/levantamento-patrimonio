import { UsuarioSchema, UsuarioUpdateSchema } from '../../../../../utils/validators/schemas/zod/UsuarioSchema';

describe('UsuarioSchema', () => {
    it('analisa dados válidos corretamente', () => {
        const dadosValidos = { 
            campus: "507f191e810c19729de860ea", // Exemplo de ObjectId
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        const resultado = UsuarioSchema.parse(dadosValidos);
        expect(resultado).toEqual(dadosValidos);
    });

    it('lança um erro quando "nome" está ausente', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            cpf: '12345678909', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo nome é obrigatório/);
    });

    it('lança um erro quando "cpf" está ausente', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo CPF é obrigatório/);
    });

    it('lança um erro quando "cpf" tem menos de 11 dígitos', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '123456789', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/CPF deve conter 11 dígitos numéricos/);
    });

    it('lança um erro quando "cpf" é inválido', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678901', // CPF inválido
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/CPF inválido/);
    });

    it('lança um erro quando "email" está ausente', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Campo email é obrigatório/);
    });

    it('lança um erro quando "email" está em um formato inválido', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            email: 'usuarioexemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/Formato de email inválido/);
    });

    it('lança um erro quando "senha" não atende aos requisitos de complexidade', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            email: 'usuario@exemplo.com', 
            senha: 'senha123', // Senha não atende aos requisitos
            cargo: 'Comissionado' 
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/A senha deve ter pelo menos 8 caracteres/);
    });

    it('lança um erro quando "cargo" é inválido', () => {
        const dadosInvalidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Cargo Inexistente' // Cargo inválido
        };
        expect(() => UsuarioSchema.parse(dadosInvalidos)).toThrowError(/O cargo deve ser "Comissionado" ou "Funcionario Cpalm"/);
    });

    it('define "status" como true quando não fornecido', () => {
        const dadosValidos = { 
            campus: "507f191e810c19729de860ea", 
            nome: 'Usuário Teste', 
            cpf: '12345678909', 
            email: 'usuario@exemplo.com', 
            senha: 'Senha@123', 
            cargo: 'Comissionado' 
        };
        const resultado = UsuarioSchema.parse(dadosValidos);
        expect(resultado.status).toBe(true);
    });
});

describe('UsuarioUpdateSchema', () => {
    it('analisa dados parciais corretamente', () => {
        const dadosParciais = { 
            nome: 'Usuário Atualizado' 
        };
        const resultado = UsuarioUpdateSchema.parse(dadosParciais);
        expect(resultado.nome).toBe('Usuário Atualizado');
        // Campos não fornecidos permanecem indefinidos
        expect(resultado.cpf).toBeUndefined();
        expect(resultado.email).toBeUndefined();
        expect(resultado.senha).toBeUndefined();
        expect(resultado.cargo).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('aplica valores padrão quando nenhum dado é fornecido para atualização', () => {
        const resultado = UsuarioUpdateSchema.parse({});
        // Todos os campos devem ser indefinidos, mas "status" deve ser true
        expect(resultado.nome).toBeUndefined();
        expect(resultado.cpf).toBeUndefined();
        expect(resultado.email).toBeUndefined();
        expect(resultado.senha).toBeUndefined();
        expect(resultado.cargo).toBeUndefined();
        expect(resultado.status).toBe(true);
    });

    it('lança um erro quando "nome" for fornecido mas vazio', () => {
        const dadosInvalidos = { nome: '' };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/Campo nome é obrigatório/);
    });

    it('valida "senha" se fornecida', () => {
        const dadosInvalidos = { 
            nome: 'Usuário Atualizado', 
            senha: 'senha123' // Senha não atende aos requisitos
        };
        expect(() => UsuarioUpdateSchema.parse(dadosInvalidos)).toThrowError(/A senha deve ter pelo menos 8 caracteres/);
    });
});