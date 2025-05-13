 //src/controllers/ImportacaoController.js

import csv from "csv-parser";
import fs from "fs";
import path from "path";
import ValidationError from "../utils/errors/ValidationError.js";

class ImportacaoController {
  validarDados(req, res, next) {
    if (!req.file) {
      return next(new ValidationError("ARQUIVO CSV NÃO ENVIADO."));
    }
  }

  // POST /importacao/csv
  async importarCSV(req, res, next) {
    this.validarDados(req, res, next);

    try {
      const resultados = [];
      const filePath = path.resolve(req.file.path);

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => resultados.push(data))
        .on("end", () => {
          return res.status(200).json({
            mensagem: "IMPORTAÇÃO CONCLUÍDA COM SUCESSO.",
            dadosImportados: resultados,
          });
        })
        .on("error", (erro) => {
          return next(erro);
        });
    } catch (erro) {
      return next(erro);
    }
  }
}

export default ImportacaoController;
