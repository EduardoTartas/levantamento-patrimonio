import SalaFilterBuilder from '@repositories/filters/SalaFilterBuild.js';

describe('SalaFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new SalaFilterBuilder();
  });

  describe('Constructor', () => {
    test('deve criar instância com propriedades inicializadas', () => {
      expect(builder.filtros).toEqual({});
      expect(builder.salaRepository).toBeDefined();
      expect(builder.salaModel).toBeDefined();
    });
  });

  describe('comNome', () => {
    test('deve adicionar filtro regex para nome', () => {
      const result = builder.comNome('sala');
      expect(result).toBe(builder);
      expect(builder.build().nome).toEqual({ $regex: 'sala', $options: 'i' });
    });

    test('deve usar ^ para nomes com 1 caractere', () => {
      builder.comNome('s');
      expect(builder.build().nome).toEqual({ $regex: '^s', $options: 'i' });
    });

    test('deve escapar caracteres especiais', () => {
      builder.comNome('Sala [A-1]');
      expect(builder.build().nome).toEqual({ $regex: 'Sala\\ \\[A\\-1\\]', $options: 'i' });
    });

    test('deve ignorar valores inválidos', () => {
      ['', null, undefined].forEach(value => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comNome(value);
        expect(result).toBe(newBuilder);
        expect(newBuilder.build().nome).toBeUndefined();
      });
    });
  });

  describe('comCampus', () => {
    test('deve adicionar filtro para ObjectId válido', () => {
      const validId = '507f1f77bcf86cd799439011';
      const result = builder.comCampus(validId);
      expect(result).toBe(builder);
      expect(builder.build().campus).toBe(validId);
    });

    test('deve ignorar ids inválidos', () => {
      const invalidIds = ['invalid_id', '507f1f77bcf86cd79943901', '', null, undefined];
      invalidIds.forEach(id => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comCampus(id);
        expect(result).toBe(newBuilder);
        expect(newBuilder.build().campus).toBeUndefined();
      });
    });
  });

  describe('comBloco', () => {
    test('deve adicionar filtro regex para bloco', () => {
      const result = builder.comBloco('Bloco A');
      expect(result).toBe(builder);
      expect(builder.build().bloco).toEqual({ $regex: 'Bloco\\ A', $options: 'i' });
    });

    test('deve escapar caracteres especiais', () => {
      builder.comBloco('Bloco-A [Setor.1]');
      expect(builder.build().bloco).toEqual({ $regex: 'Bloco\\-A\\ \\[Setor\\.1\\]', $options: 'i' });
    });

    test('deve ignorar valores inválidos', () => {
      ['', null, undefined].forEach(value => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comBloco(value);
        expect(result).toBe(newBuilder);
        expect(newBuilder.build().bloco).toBeUndefined();
      });
    });
  });

  describe('escapeRegex', () => {
    test('deve escapar caracteres especiais', () => {
      const input = 'Sala[1] (A) - Teste.Lab';
      const result = builder.escapeRegex(input);
      expect(result).toBe('Sala\\[1\\]\\ \\(A\\)\\ \\-\\ Teste\\.Lab');
    });

    test('deve retornar string vazia para entrada vazia', () => {
      expect(builder.escapeRegex('')).toBe('');
    });

    test('deve processar strings sem caracteres especiais', () => {
      expect(builder.escapeRegex('SalaSimples123')).toBe('SalaSimples123');
    });
  });

  describe('build', () => {
    test('deve retornar objeto vazio quando nenhum filtro foi adicionado', () => {
      expect(builder.build()).toEqual({});
    });

    test('deve retornar todos os filtros acumulados', () => {
      builder
        .comNome('Sala')
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco('A');
      
      expect(builder.build()).toEqual({
        nome: { $regex: 'Sala', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: 'A', $options: 'i' }
      });
    });

    test('deve retornar apenas filtros válidos', () => {
      builder
        .comNome('Sala')
        .comCampus('invalid_id')
        .comBloco('')
        .comCampus('507f1f77bcf86cd799439011');
      
      expect(builder.build()).toEqual({
        nome: { $regex: 'Sala', $options: 'i' },
        campus: '507f1f77bcf86cd799439011'
      });
    });

    test('deve permitir múltiplas chamadas de build', () => {
      builder.comNome('Teste');
      const filtros1 = builder.build();
      const filtros2 = builder.build();
      expect(filtros1).toEqual(filtros2);
    });
  });

  describe('Integração e Chaining', () => {
    test('deve manter fluent interface para todos os métodos', () => {
      const result = builder
        .comNome('Teste')
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco('A')
        .comNome('NovoNome');
      
      expect(result).toBe(builder);
      expect(builder.build().nome).toEqual({ $regex: 'NovoNome', $options: 'i' });
    });

    test('deve funcionar com encadeamento de valores válidos e inválidos', () => {
      builder
        .comNome('')
        .comNome('Teste')
        .comCampus('invalid')
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco(null)
        .comBloco('B');
      
      expect(builder.build()).toEqual({
        nome: { $regex: 'Teste', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: 'B', $options: 'i' }
      });
    });
  });
});
