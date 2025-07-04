import AuthenticationError from "@utils/errors/AuthenticationError.js";
import CustomError from "@utils/helpers/CustomError.js";

describe("AuthenticationError", () => {
  it("deve instanciar AuthenticationError corretamente com todos os parâmetros", () => {
    const message = "Token inválido";
    const field = "token";
    const details = { expired: true };

    const error = new AuthenticationError(message, field, details);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.statusCode).toBe(401);
    expect(error.errorType).toBe("authentication");
    expect(error.customMessage).toBe(message);
    expect(error.field).toBe(field);
    expect(error.details).toEqual(details);
  });

  it("deve instanciar AuthenticationError corretamente com apenas a mensagem", () => {
    const message = "Acesso negado";

    const error = new AuthenticationError(message);

    expect(error.statusCode).toBe(401);
    expect(error.errorType).toBe("authentication");
    expect(error.customMessage).toBe(message);
    expect(error.field).toBeNull();
    expect(error.details).toBeNull();
  });
});
