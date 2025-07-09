import SendMail from "@utils/SendMail.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

jest.mock("nodemailer");
jest.mock("crypto");

describe("SendMail", () => {
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: "12345" });

  beforeEach(() => {
    jest.clearAllMocks();

    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    crypto.randomBytes.mockReturnValue(Buffer.from("123456789012"));
  });

  describe("enviaEmail", () => {
    it("não deve enviar email se DISABLED_EMAIL estiver ativado", async () => {
      process.env.DISABLED_EMAIL = "true";

      const result = await SendMail.enviaEmail({
        to: "test@test.com",
        subject: "Teste",
        html: "<p>Teste</p>",
        text: "Teste",
      });

      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("deve enviar email corretamente quando habilitado", async () => {
      process.env.DISABLED_EMAIL = "";
      process.env.EMAIL_HOST = "smtp.test.com";
      process.env.EMAIL_PORT = "587";
      process.env.EMAIL_USER = "user@test.com";
      process.env.EMAIL_PASS = "password";

      await SendMail.enviaEmail({
        to: "test@test.com",
        subject: "Teste",
        html: "<p>Teste</p>",
        text: "Teste",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.EMAIL_USER,
          to: "test@test.com",
          subject: expect.stringContaining("Teste Email: #"),
          html: "<p>Teste</p>",
          text: "Teste",
        })
      );
    });

    it("deve tratar erros ao enviar email", async () => {
      process.env.DISABLED_EMAIL = "";
      mockSendMail.mockRejectedValueOnce(new Error("Falha ao enviar"));

      const result = await SendMail.enviaEmail({
        to: "test@test.com",
        subject: "Teste",
        html: "<p>Teste</p>",
        text: "Teste",
      });

      expect(result).toEqual({
        error: true,
        code: 500,
        message: "Erro interno do Servidor",
      });
    });
  });

  describe("enviaEmailError", () => {
    it("deve enviar email de erro para admin", async () => {
      process.env.DISABLED_EMAIL = "";
      process.env.ADMIN_EMAIL = "admin@test.com";

      const err = new Error("Teste de erro");
      const pathname = "UsuarioService.js";
      const date = new Date();
      const req = {
        method: "POST",
        protocol: "http",
        get: () => "localhost:3000",
        originalUrl: "/api/usuarios",
      };

      await SendMail.enviaEmailError(err, pathname, date, req);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@test.com",
          subject: expect.stringContaining("Erro interno do servidor na classe: UsuarioService.js"),
        })
      );
    });
  });
});
