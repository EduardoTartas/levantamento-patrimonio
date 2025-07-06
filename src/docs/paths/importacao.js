const importacaoPaths = {
  "/csv/{campusId}": {
    post: {
      tags: ["Importação"],
      summary: "Importar bens via arquivo CSV para um campus específico",
      description:
        "Realiza a importação em massa de bens patrimoniais a partir de um arquivo CSV para o campus informado. O arquivo deve seguir o layout padrão do sistema.",
      operationId: "importarCSV",
      parameters: [
        {
          name: "campusId",
          in: "path",
          required: true,
          description: "ID do campus para o qual os bens serão importados.",
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                csv: {
                  type: "string",
                  format: "binary",
                  description: "Arquivo CSV contendo os bens a serem importados.",
                },
              },
              required: ["csv"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Importação realizada com sucesso.",
          content: {
            "application/json": {
              schema: {
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
                            erro: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  message: "Importação do arquivo 'bens.csv' concluída.",
                  resumo: {
                    totalLinhas: 100,
                    importados: 95,
                    ignorados: 5,
                    erros: [
                      { linha: 10, erro: "Tombo duplicado" },
                      { linha: 25, erro: "CPF inválido" },
                    ],
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Requisição inválida ou arquivo CSV ausente/inválido.",
          content: {
            "application/json": {
              schema: {
                $ref: "../schemas/swaggerCommonResponses.js#/BadRequest"
              }
            }
          }
        },
        401: {
          description: "Token de autenticação ausente ou inválido.",
          content: {
            "application/json": {
              schema: {
                $ref: "../schemas/swaggerCommonResponses.js#/Unauthorized"
              }
            }
          }
        },
        500: {
          description: "Erro interno do servidor.",
          content: {
            "application/json": {
              schema: {
                $ref: "../schemas/swaggerCommonResponses.js#/InternalServerError"
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }],
    },
  },
};

export default importacaoPaths;
