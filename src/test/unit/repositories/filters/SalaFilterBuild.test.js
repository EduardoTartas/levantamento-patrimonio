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
      expect(typeof builder.salaRepository).toBe('object');
      expect(typeof builder.salaModel).toBe('function');
    });
  });

  describe('comNome', () => {
    test('deve adicionar filtro regex para nome com mais de um caractere', () => {
      const result = builder.comNome('sala');
      expect(result).toBe(builder); // chaining
      expect(builder.build().nome).toEqual({ $regex: 'sala', $options: 'i' });
    });

    test('deve adicionar filtro regex iniciando com ^ quando tamanho for 1', () => {
      builder.comNome('s');
      expect(builder.build().nome).toEqual({ $regex: '^s', $options: 'i' });
    });

    test('deve escapar caracteres especiais no nome', () => {
      builder.comNome('Sala [A-1] (Teste)');
      expect(builder.build().nome).toEqual({ $regex: 'Sala\\ \\[A\\-1\\]\\ \\(Teste\\)', $options: 'i' });
    });

    test('deve processar nomes com diferentes tamanhos', () => {
      const cases = [
        { input: 'A', expected: { $regex: '^A', $options: 'i' } },
        { input: 'AB', expected: { $regex: 'AB', $options: 'i' } },
        { input: 'Laboratório', expected: { $regex: 'Laboratório', $options: 'i' } }
      ];

      cases.forEach(({ input, expected }) => {
        const newBuilder = new SalaFilterBuilder();
        newBuilder.comNome(input);
        expect(newBuilder.build().nome).toEqual(expected);
      });
    });

    test('deve processar caracteres especiais diversos', () => {
      const specialNames = ['Sala-101', 'Sala_102', 'Sala.103', 'Sala#104'];
      specialNames.forEach(nome => {
        const newBuilder = new SalaFilterBuilder();
        newBuilder.comNome(nome);
        const filtros = newBuilder.build();
        expect(filtros.nome).toBeDefined();
        expect(filtros.nome.$options).toBe('i');
      });
    });

    test('deve ignorar valores inválidos', () => {
      ['', null, undefined].forEach(value => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comNome(value);
        expect(result).toBe(newBuilder); // chaining mantido
        expect(newBuilder.build().nome).toBeUndefined();
      });
    });

    test('deve processar nome com apenas espaços', () => {
      builder.comNome('   ');
      expect(builder.build().nome).toEqual({ $regex: '\\ \\ \\ ', $options: 'i' });
    });

    test('deve manter chaining com valores mistos', () => {
      const result = builder.comNome('').comNome(null).comNome('Válido');
      expect(result).toBe(builder);
      expect(builder.build().nome).toEqual({ $regex: 'Válido', $options: 'i' });
    });
  });

  describe('comCampus', () => {
    test('deve adicionar filtro para ObjectId válido', () => {
      const validId = '507f1f77bcf86cd799439011';
      const result = builder.comCampus(validId);
      expect(result).toBe(builder); // chaining
      expect(builder.build().campus).toBe(validId);
    });

    test('deve aceitar ObjectIds com diferentes casos', () => {
      const ids = ['507f1f77bcf86cd799439011', '507F1F77BCF86CD799439011', '123456789012345678901234'];
      ids.forEach(id => {
        const newBuilder = new SalaFilterBuilder();
        newBuilder.comCampus(id);
        expect(newBuilder.build().campus).toBe(id);
      });
    });

    test('deve ignorar ids inválidos', () => {
      const invalidIds = [
        'invalid_id', // não é hex
        '507f1f77bcf86cd79943901', // 23 chars
        '507f1f77bcf86cd7994390111', // 25 chars
        '507g1f77bcf86cd799439011', // 'g' não é hex
        '507f1f77-bcf86cd799439011', // '-' não é hex
        '', null, undefined, '   '
      ];

      invalidIds.forEach(id => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comCampus(id);
        expect(result).toBe(newBuilder); // chaining mantido
        expect(newBuilder.build().campus).toBeUndefined();
      });
    });

    test('deve manter chaining com valores inválidos', () => {
      const result = builder.comCampus('invalid').comCampus('507f1f77bcf86cd799439011');
      expect(result).toBe(builder);
      expect(builder.build().campus).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('comBloco', () => {
    test('deve adicionar filtro regex para bloco', () => {
      const result = builder.comBloco('Bloco A');
      expect(result).toBe(builder); // chaining
      expect(builder.build().bloco).toEqual({ $regex: 'Bloco\\ A', $options: 'i' });
    });

    test('deve escapar caracteres especiais no bloco', () => {
      builder.comBloco('Bloco-A [Setor.1]');
      expect(builder.build().bloco).toEqual({ $regex: 'Bloco\\-A\\ \\[Setor\\.1\\]', $options: 'i' });
    });

    test('deve processar diferentes tipos de blocos', () => {
      const cases = [
        { input: 'A', expected: { $regex: 'A', $options: 'i' } },
        { input: 'Bloco 1', expected: { $regex: 'Bloco\\ 1', $options: 'i' } },
        { input: 'Admin', expected: { $regex: 'Admin', $options: 'i' } }
      ];

      cases.forEach(({ input, expected }) => {
        const newBuilder = new SalaFilterBuilder();
        newBuilder.comBloco(input);
        expect(newBuilder.build().bloco).toEqual(expected);
      });
    });

    test('deve ignorar valores inválidos', () => {
      ['', null, undefined].forEach(value => {
        const newBuilder = new SalaFilterBuilder();
        const result = newBuilder.comBloco(value);
        expect(result).toBe(newBuilder); // chaining mantido
        expect(newBuilder.build().bloco).toBeUndefined();
      });
    });

    test('deve processar blocos com apenas espaços', () => {
      builder.comBloco('   ');
      expect(builder.build().bloco).toEqual({ $regex: '\\ \\ \\ ', $options: 'i' });
    });
  });

  describe('escapeRegex', () => {
    test('deve escapar caracteres especiais completos', () => {
      const input = 'Sala[1] (A) - Teste.Lab #1 $100 *importante* +novo+ ?query? ^inicio^ |pipe| \\backslash\\';
      const result = builder.escapeRegex(input);
      expect(result).toBe('Sala\\[1\\]\\ \\(A\\)\\ \\-\\ Teste\\.Lab\\ \\#1\\ \\$100\\ \\*importante\\*\\ \\+novo\\+\\ \\?query\\?\\ \\^inicio\\^\\ \\|pipe\\|\\ \\\\backslash\\\\');
    });

    test('deve retornar string vazia para entrada vazia', () => {
      expect(builder.escapeRegex('')).toBe('');
    });

    test('deve processar strings sem caracteres especiais', () => {
      expect(builder.escapeRegex('SalaSimples123')).toBe('SalaSimples123');
    });

    test('deve tratar casos extremos individuais', () => {
      const cases = [
        { input: ' ', expected: '\\ ' },
        { input: '.', expected: '\\.' },
        { input: '[]', expected: '\\[\\]' },
        { input: '()', expected: '\\(\\)' },
        { input: '-', expected: '\\-' },
        { input: '*', expected: '\\*' }
      ];

      cases.forEach(({ input, expected }) => {
        expect(builder.escapeRegex(input)).toBe(expected);
      });
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
        .comCampus('invalid_id') // será ignorado
        .comBloco('') // será ignorado
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
      expect(filtros1).toEqual({ nome: { $regex: 'Teste', $options: 'i' } });
    });

    test('deve refletir estado atual dos filtros', () => {
      // Note: build() retorna referência ao objeto filtros, então mudanças são refletidas
      builder.comNome('Inicial');
      const snapshot1 = JSON.parse(JSON.stringify(builder.build())); // cópia
      
      builder.comBloco('NovoBloco');
      const filtros2 = builder.build();
      
      expect(snapshot1).toEqual({ nome: { $regex: 'Inicial', $options: 'i' } });
      expect(filtros2).toEqual({
        nome: { $regex: 'Inicial', $options: 'i' },
        bloco: { $regex: 'NovoBloco', $options: 'i' }
      });
    });

    test('deve retornar referência ao objeto filtros interno', () => {
      const filtros = builder.build();
      expect(filtros).toBe(builder.filtros);
    });
  });

  describe('Integração e Chaining', () => {
    test('deve manter fluent interface para todos os métodos', () => {
      const result = builder
        .comNome('Teste')
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco('A')
        .comNome('NovoNome'); // sobrescreve anterior
      
      expect(result).toBe(builder);
      expect(builder.build().nome).toEqual({ $regex: 'NovoNome', $options: 'i' });
    });

    test('deve permitir combinações complexas de filtros', () => {
      builder
        .comNome('Lab')
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco('Ciências')
        .comNome('L') // sobrescreve
        .comBloco('Exatas'); // sobrescreve
      
      expect(builder.build()).toEqual({
        nome: { $regex: '^L', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: 'Exatas', $options: 'i' }
      });
    });

    test('deve funcionar com encadeamento de valores válidos e inválidos', () => {
      builder
        .comNome('') // ignorado
        .comNome('Teste') // válido
        .comCampus('invalid') // ignorado
        .comCampus('507f1f77bcf86cd799439011') // válido
        .comBloco(null) // ignorado
        .comBloco('B'); // válido
      
      expect(builder.build()).toEqual({
        nome: { $regex: 'Teste', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: 'B', $options: 'i' }
      });
    });

    test('deve permitir reinicialização com novo builder', () => {
      builder.comNome('Original').comCampus('507f1f77bcf86cd799439011');
      const original = builder.build();
      
      const newBuilder = new SalaFilterBuilder();
      newBuilder.comNome('Novo');
      
      expect(original.nome).toEqual({ $regex: 'Original', $options: 'i' });
      expect(newBuilder.build().nome).toEqual({ $regex: 'Novo', $options: 'i' });
      expect(newBuilder.build().campus).toBeUndefined();
    });

    test('deve tratar sobrescrita de filtros corretamente', () => {
      builder
        .comNome('Primeiro')
        .comNome('Segundo')
        .comBloco('BlocoA')
        .comBloco('BlocoB');
      
      expect(builder.build()).toEqual({
        nome: { $regex: 'Segundo', $options: 'i' },
        bloco: { $regex: 'BlocoB', $options: 'i' }
      });
    });

    test('deve manter consistência com valores edge case em chaining', () => {
      const result = builder
        .comNome('A') // 1 char - deve ter ^
        .comCampus('507f1f77bcf86cd799439011')
        .comBloco('   ') // espaços - deve escapar
        .comNome('') // vazio - deve ser ignorado (mantém 'A')
        .comCampus('invalid'); // inválido - deve ser ignorado (mantém válido)
      
      expect(result).toBe(builder);
      expect(builder.build()).toEqual({
        nome: { $regex: '^A', $options: 'i' },
        campus: '507f1f77bcf86cd799439011',
        bloco: { $regex: '\\ \\ \\ ', $options: 'i' }
      });
    });
  });
});
