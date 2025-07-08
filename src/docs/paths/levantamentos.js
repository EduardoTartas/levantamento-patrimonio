import commonResponses from "../schemas/swaggerCommonResponses.js";

const levantamentoPaths = {
  "/levantamentos": {
    get: {
      tags: ["Levantamentos"],
      summary: "Listar levantamentos",
      description: `
        + Caso de uso: Listagem de levantamentos patrimoniais realizados.
        
        + Função de Negócio:
            - Permitir consulta paginada de levantamentos registrados no sistema.
            - Aplicar filtros por inventário, bem, tombo, responsável, estado e outros.
            - Fornecer dados para auditoria e controle patrimonial.

        + Regras de Negócio:
            - Validar parâmetros de filtro fornecidos.
            - Aplicar paginação conforme limites estabelecidos.
            - Retornar apenas levantamentos que o usuário tem permissão para visualizar.

        + Resultado Esperado:
            - 200 OK com lista paginada de levantamentos conforme filtros aplicados.
      `,
      operationId: "listarLevantamentos",
      parameters: [
        {
          name: "inventario",
          in: "query",
          description: "Filtrar por ID do inventário",
          required: false,
          schema: {
            type: "string",
            format: "ObjectId"
          }
        },
        {
          name: "bem",
          in: "query",
          description: "Filtrar por nome do bem (busca parcial, case-insensitive)",
          required: false,
          schema: {
            type: "string",
            minLength: 1
          }
        },
        {
          name: "tombo",
          in: "query",
          description: "Filtrar por tombo do bem",
          required: false,
          schema: {
            type: "string",
            minLength: 1
          }
        },
        {
          name: "responsavel",
          in: "query",
          description: "Filtrar por nome do responsável (busca parcial, case-insensitive)",
          required: false,
          schema: {
            type: "string",
            minLength: 1
          }
        },
        {
          name: "estado",
          in: "query",
          description: "Filtrar por estado do bem",
          required: false,
          schema: {
            type: "string",
            enum: ["Em condições de uso", "Inservível", "Danificado"]
          }
        },
        {
          name: "ocioso",
          in: "query",
          description: "Filtrar por status ocioso do bem",
          required: false,
          schema: {
            type: "string",
            enum: ["true", "false"]
          }
        },
        {
          name: "usuario",
          in: "query",
          description: "Filtrar por ID do usuário responsável pelo levantamento",
          required: false,
          schema: {
            type: "string",
            format: "ObjectId"
          }
        },
        {
          name: "salaNova",
          in: "query",
          description: "Filtrar por ID da nova sala",
          required: false,
          schema: {
            type: "string",
            format: "ObjectId"
          }
        },
        {
          name: "page",
          in: "query",
          description: "Número da página para paginação",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1
          }
        },
        {
          "name": "limite",
          "in": "query",
          "description": "Limite de itens por página",
          "required": false,
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Lista de levantamentos retornada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "docs": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/LevantamentoListagem"
                    }
                  },
                  "totalDocs": {
                    "type": "integer",
                    "description": "Total de documentos encontrados"
                  },
                  "limit": {
                    "type": "integer",
                    "description": "Limite de itens por página"
                  },
                  "totalPages": {
                    "type": "integer",
                    "description": "Total de páginas"
                  },
                  "page": {
                    "type": "integer",
                    "description": "Página atual"
                  },
                  "pagingCounter": {
                    "type": "integer",
                    "description": "Contador de paginação"
                  },
                  "hasPrevPage": {
                    "type": "boolean",
                    "description": "Indica se há página anterior"
                  },
                  "hasNextPage": {
                    "type": "boolean",
                    "description": "Indica se há próxima página"
                  },
                  "prevPage": {
                    "type": "integer",
                    "nullable": true,
                    "description": "Número da página anterior"
                  },
                  "nextPage": {
                    "type": "integer",
                    "nullable": true,
                    "description": "Número da próxima página"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Erro de validação" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    },
    "post": {
      "tags": ["Levantamentos"],
      "summary": "Criar novo levantamento",
      "description": "Cria um novo levantamento de patrimônio",
      "operationId": "criarLevantamento",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/LevantamentoPost"
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Levantamento criado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Levantamento criado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/LevantamentoDetalhes"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Erro de validação" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    }
  },
  "/levantamentos/{id}": {
    "get": {
      "tags": ["Levantamentos"],
      "summary": "Obter levantamento por ID",
      "description": "Retorna os detalhes de um levantamento específico",
      "operationId": "obterLevantamento",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID único do levantamento",
          "schema": {
            "type": "string",
            "format": "ObjectId"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Detalhes do levantamento retornados com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Levantamento encontrado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/LevantamentoDetalhes"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "ID inválido" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Levantamento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Levantamento não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    },
    "patch": {
      "tags": ["Levantamentos"],
      "summary": "Atualizar levantamento",
      "description": "Atualiza parcialmente um levantamento existente",
      "operationId": "atualizarLevantamento",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID único do levantamento",
          "schema": {
            "type": "string",
            "format": "ObjectId"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/LevantamentoPutPatch"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Levantamento atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Levantamento atualizado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/LevantamentoDetalhes"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Dados inválidos" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Levantamento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Levantamento não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    },
    "delete": {
      "tags": ["Levantamentos"],
      "summary": "Excluir levantamento",
      "description": "Remove um levantamento do sistema",
      "operationId": "excluirLevantamento",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID único do levantamento",
          "schema": {
            "type": "string",
            "format": "ObjectId"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Levantamento excluído com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Levantamento excluído com sucesso" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "ID inválido" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Levantamento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Levantamento não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    }
  },
  "/levantamentos/fotos/{id}": {
    "post": {
      "tags": ["Levantamentos"],
      "summary": "Adicionar foto ao levantamento",
      "description": "Adiciona ou atualiza a foto de um bem no levantamento",
      "operationId": "adicionarFotoLevantamento",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID único do levantamento",
          "schema": {
            "type": "string",
            "format": "ObjectId"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "multipart/form-data": {
            "schema": {
              "$ref": "#/components/schemas/FotoUpload"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Foto adicionada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Foto adicionada com sucesso" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "imageUrl": {
                        "type": "string",
                        "example": "https://api.exemplo.com/images/levantamento_123_foto1.jpg"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Arquivo inválido ou ausente" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Levantamento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Levantamento não encontrado" }
                }
              }
            }
          }
        },
        "413": {
          "description": "Arquivo muito grande",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Arquivo muito grande. Tamanho máximo permitido: 5MB" }
                }
              }
            }
          }
        },
        "415": {
          "description": "Tipo de arquivo não suportado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Tipo de arquivo não suportado. Formatos aceitos: JPEG, PNG, GIF" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    },
    "delete": {
      "tags": ["Levantamentos"],
      "summary": "Excluir fotos do levantamento",
      "description": "Remove todas as fotos de um levantamento",
      "operationId": "excluirFotosLevantamento",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID único do levantamento",
          "schema": {
            "type": "string",
            "format": "ObjectId"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Fotos excluídas com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Fotos excluídas com sucesso" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "ID inválido" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Levantamento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Levantamento não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      },
      "security": [
        {
          "bearerAuth": []
        }
      ]
    }
  }
};

export default levantamentoPaths;
