// schemas/relatorioSchema.js

const relatorioSchemas = {
  RelatorioQuery: {
    type: "object",
    properties: {
      inventarioId: {
        type: "string",
        format: "ObjectId",
        description: "ID do inventário (obrigatório)",
        example: "507f1f77bcf86cd799439011"
      },
      tipoRelatorio: {
        type: "string",
        enum: [
          "geral",
          "bens_danificados", 
          "bens_inserviveis",
          "bens_ociosos",
          "bens_nao_encontrados",
          "bens_sem_etiqueta"
        ],
        description: "Tipo de relatório a ser gerado (obrigatório)",
        example: "geral"
      },
      sala: {
        type: "string",
        format: "ObjectId",
        description: "ID da sala para filtrar o relatório (opcional)",
        example: "507f1f77bcf86cd799439012"
      }
    },
    required: ["inventarioId", "tipoRelatorio"],
    description: "Schema para parâmetros de geração de relatório"
  },
  RelatorioResponse: {
    type: "string",
    format: "binary",
    description: "Arquivo PDF do relatório gerado",
    example: "Binary PDF content"
  },
  RelatorioError: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false
      },
      message: {
        type: "string",
        example: "inventarioId e tipoRelatorio são obrigatórios."
      },
      error: {
        type: "string",
        example: "Parâmetros inválidos"
      }
    },
    description: "Schema de resposta de erro para relatórios"
  },
  TiposRelatorio: {
    type: "object",
    properties: {
      geral: {
        type: "string",
        description: "Relatório geral com todos os levantamentos do inventário",
        example: "Inclui todos os bens do inventário"
      },
      bens_danificados: {
        type: "string", 
        description: "Relatório apenas dos bens marcados como danificados",
        example: "Bens com estado 'Danificado'"
      },
      bens_inserviveis: {
        type: "string",
        description: "Relatório apenas dos bens marcados como inservíveis", 
        example: "Bens com estado 'Inservível'"
      },
      bens_ociosos: {
        type: "string",
        description: "Relatório apenas dos bens marcados como ociosos",
        example: "Bens com ocioso = true"
      },
      bens_nao_encontrados: {
        type: "string",
        description: "Relatório dos bens que não foram encontrados no levantamento",
        example: "Bens com ocioso = false"
      },
      bens_sem_etiqueta: {
        type: "string",
        description: "Relatório dos bens que não possuem tombo/etiqueta",
        example: "Bens com tombo nulo ou vazio"
      }
    },
    description: "Descrição dos tipos de relatório disponíveis"
  }
};

export default relatorioSchemas;
