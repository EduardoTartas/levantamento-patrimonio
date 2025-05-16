lobal.console = {
  ...console,
  // Manter erros visíveis
  error: jest.fn(),
  // Suprimir logs de informação
  log: jest.fn(),
  // Suprimir logs de aviso
  warn: jest.fn(),
  // Manter logs de informação
  info: jest.fn()
};