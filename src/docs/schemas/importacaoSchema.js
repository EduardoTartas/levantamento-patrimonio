const importacaoSchemas = {
  ImportacaoCSVRequest: {
    type: "object",
    properties: {
      csv: {
        type: "string",
        format: "binary",
        description: "Arquivo CSV contendo os bens a serem importados."
      }
    },
    required: ["csv"],
    description: "Schema para upload de arquivo CSV de bens patrimoniais."
  },
  ImportacaoCSVResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      resumo: {
        type: "object",
        properties: {
          totalLinhas: { type: "integer" },
          importados: { type: "integer" },
          ignorados: { type: "integer" },
          erros: {
            type: "array",
            items: {
              type: "object",
              properties: {
                linha: { type: "integer" },
                erro: { type: "string" }
              }
            }
          }
        }
      }
    },
    example: {
      message: "Importação do arquivo 'bens.csv' concluída.",
      resumo: {
        totalLinhas: 100,
        importados: 95,
        ignorados: 5,
        erros: [
          { linha: 10, erro: "Tombo duplicado" },
          { linha: 25, erro: "CPF inválido" }
        ]
      }
    },
    description: "Schema de resposta para importação de bens via CSV."
  }
};

export default importacaoSchemas;
