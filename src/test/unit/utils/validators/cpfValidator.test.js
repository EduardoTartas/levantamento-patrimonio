import isValidCPF from '@utils/cpfValidator';

describe('isValidCPF', () => {
  describe('CPFs Válidos (verificados com a lógica da função)', () => {
    const validCPFs = [
      '11144477735',
      '52998224725',
      '12345678909',
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
