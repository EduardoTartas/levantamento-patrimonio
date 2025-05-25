import isValidCPF from '@utils/cpfValidator';

describe('isValidCPF', () => {
  describe('CPFs Válidos (verificados com a lógica da função)', () => {
    const validCPFs = [
      '11144477735', // Base: 111.444.777-35
      '52998224725', // Base: 529.982.247-25
      '12345678909', // Gerado: 123.456.789-09
      '71120635071',
      '36119012028'
    ];

    validCPFs.forEach(cpf => {
      test(`deve retornar true para CPF válido: ${cpf}`, () => {
        expect(isValidCPF(cpf)).toBe(true);
      });
    });

    test('deve retornar true para CPF válido com formatação (111.444.777-35)', () => {
      expect(isValidCPF("111.444.777-35")).toBe(true);
    });

    test('deve retornar true para CPF válido com formatação (529.982.247-25)', () => {
      expect(isValidCPF("529.982.247-25")).toBe(true);
    });
  });

  describe('CPFs Inválidos', () => {
    test('deve retornar false para CPF com tipo de entrada inválido (número)', () => {
      expect(isValidCPF(12345678900)).toBe(false);
    });

    test('deve retornar false para CPF com tipo de entrada inválido (nulo)', () => {
      expect(isValidCPF(null)).toBe(false);
    });

    test('deve retornar false para CPF com tipo de entrada inválido (undefined)', () => {
      expect(isValidCPF(undefined)).toBe(false);
    });

    test('deve retornar false para string vazia', () => {
      expect(isValidCPF('')).toBe(false);
    });

    test('deve retornar false para CPF com menos de 11 dígitos numéricos', () => {
      expect(isValidCPF('123.456.789-0')).toBe(false);
    });

    test('deve retornar false para CPF com mais de 11 dígitos numéricos', () => {
      expect(isValidCPF('123.456.789-0011')).toBe(false);
    });

    test('deve retornar false para CPF com todos os dígitos iguais', () => {
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('000.000.000-00')).toBe(false);
      expect(isValidCPF('88888888888')).toBe(false);
    });

    test('deve retornar false para CPF com primeiro dígito verificador incorreto', () => {
      expect(isValidCPF('11144477705')).toBe(false);
    });

    test('deve retornar false para CPF com segundo dígito verificador incorreto', () => {
      expect(isValidCPF('11144477730')).toBe(false);
    });

    test('deve retornar false para um CPF sabidamente inválido (sequência)', () => {
      expect(isValidCPF('12345678910')).toBe(false);
    });
  });
});