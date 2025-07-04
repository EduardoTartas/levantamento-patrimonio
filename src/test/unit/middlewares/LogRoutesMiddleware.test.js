import logRoutes from '@middlewares/LogRoutesMiddleware';

describe('LogRoutesMiddleware', () => {
  let req, res, next, consoleSpy;

  beforeEach(() => {
    req = {
      headers: {},
      socket: {},
      method: 'GET',
      protocol: 'http',
      originalUrl: '/test',
      get: jest.fn().mockReturnValue('localhost:3000')
    };
    res = {};
    next = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('deve fazer log da requisição com x-forwarded-for', async () => {
    req.headers['x-forwarded-for'] = '192.168.1.1';

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('192.168.1.1 GET http://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve fazer log da requisição com socket.remoteAddress', async () => {
    req.socket.remoteAddress = '127.0.0.1';

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1 GET http://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve fazer log da requisição com IP null', async () => {
    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('null GET http://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve capturar erro e continuar execução', async () => {
    req.get = jest.fn().mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('Erro ao fazer o log', expect.any(Error));
    expect(next).toHaveBeenCalled();
  });

  it('deve priorizar x-forwarded-for sobre socket.remoteAddress', async () => {
    req.headers['x-forwarded-for'] = '192.168.1.1';
    req.socket.remoteAddress = '127.0.0.1';

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('192.168.1.1 GET http://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve fazer log com diferentes métodos HTTP', async () => {
    req.method = 'POST';
    req.headers['x-forwarded-for'] = '192.168.1.1';

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('192.168.1.1 POST http://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve fazer log com protocolo HTTPS', async () => {
    req.protocol = 'https';
    req.headers['x-forwarded-for'] = '192.168.1.1';

    await logRoutes(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('192.168.1.1 GET https://localhost:3000/test')
    );
    expect(next).toHaveBeenCalled();
  });
});
