import SalaFilterBuilder from '@repositories/filters/SalaFilterBuild.js';

describe('SalaFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new SalaFilterBuilder();
  });

  test('comNome deve adicionar filtro regex para nome com mais de um caractere', () => {
    builder.comNome('sala');
    const filtros = builder.build();
    expect(filtros.nome).toEqual({ $regex: 'sala', $options: 'i' });
  });

  test('comNome deve adicionar filtro regex iniciando com letra quando tamanho for 1', () => {
    builder.comNome('s');
    const filtros = builder.build();
    expect(filtros.nome).toEqual({ $regex: '^s', $options: 'i' });
  });

  test('comNome deve ignorar nome vazio', () => {
    builder.comNome('');
    const filtros = builder.build();
    expect(filtros.nome).toBeUndefined();
  });

  test('comCampus deve adicionar filtro se id for válido (24 hex)', () => {
    const validId = '507f1f77bcf86cd799439011';
    builder.comCampus(validId);
    const filtros = builder.build();
    expect(filtros.campus).toBe(validId);
  });

  test('comCampus deve ignorar id inválido', () => {
    builder.comCampus('invalid_id');
    const filtros = builder.build();
    expect(filtros.campus).toBeUndefined();
  });

  test('comBloco deve adicionar filtro regex corretamente', () => {
    builder.comBloco('Bloco A');
    const filtros = builder.build();
    expect(filtros.bloco).toEqual({ $regex: 'Bloco\\ A', $options: 'i' });
  });

  test('comBloco deve ignorar bloco vazio', () => {
    builder.comBloco('');
    const filtros = builder.build();
    expect(filtros.bloco).toBeUndefined();
  });

  test('escapeRegex deve escapar caracteres especiais', () => {
    const resultado = builder.escapeRegex('Sala[1] (A)');
    expect(resultado).toBe('Sala\\[1\\]\\ \\(A\\)');
  });

  test('build deve retornar todos os filtros acumulados', () => {
    builder.comNome('Sala').comCampus('507f1f77bcf86cd799439011').comBloco('A');
    const filtros = builder.build();

    expect(filtros).toEqual({
      nome: { $regex: 'Sala', $options: 'i' },
      campus: '507f1f77bcf86cd799439011',
      bloco: { $regex: 'A', $options: 'i' }
    });
  });
});
