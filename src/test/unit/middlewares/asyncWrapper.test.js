import asyncWrapper from "@middlewares/asyncWrapper";

describe("asyncWrapper", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it("deve executar a função assíncrona sem erro e chamar next sem argumentos", async () => {
    const handler = jest.fn().mockResolvedValue("ok");
    const wrapped = asyncWrapper(handler);

    wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

 it("deve capturar erros e passá-los para o next", async () => {
  const error = new Error("Algo deu errado");
  const handler = jest.fn(() => Promise.reject(error));
  const wrapped = asyncWrapper(handler);

  const req = {};
  const res = {};
  const next = jest.fn();

  await wrapped(req, res, next);  // Espera a Promise resolver

  expect(next).toHaveBeenCalledWith(error);
});
});
