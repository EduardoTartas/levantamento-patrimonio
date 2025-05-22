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

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterAll(() => {
    if (console.error.mockRestore) {
        console.error.mockRestore();
    }
    if (console.log.mockRestore) {
        console.log.mockRestore();
    }
});
