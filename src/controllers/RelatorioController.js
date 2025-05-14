// src/controllers/RelatorioController.js

import ValidationError from "../utils/errors/ValidationError.js";

class RelatorioController {
  validarDados(req, res, next) {
    const { inventarioId, tipoRelatorio } = req.query;

    if (!inventarioId || !tipoRelatorio) {
      return next(
        new ValidationError("OS PARÂMETROS 'inventarioId' E 'tipoRelatorio' SÃO OBRIGATÓRIOS.")
      );
    }
  }

  // GET /relatorio/relatorios
  async gerarRelatorio(req, res, next) {
    this.validarDados(req, res, next);

    try {
      const { inventarioId, sala, tipoRelatorio } = req.query;

      // Simulação de dados (substitua com sua lógica real)
      const dados = [
        { nome: "NOTEBOOK", patrimonio: "A123456" },
        { nome: "MONITOR", patrimonio: "B654321" },
      ];

      return res.status(200).json({
        mensagem: "RELATÓRIO GERADO COM SUCESSO.",
        relatorio: {
          inventarioId,
          tipoRelatorio,
          sala: sala || "TODAS AS SALAS",
          dados,
        },
      });
    } catch (erro) {
      return next(erro);
    }
  }
}

export default RelatorioController;
