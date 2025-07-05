const bemPaths = {
  "/bens": {
    "get": {
      "tags": ["Bem"],
      "summary": "Listar bens",
      "description": "Retorna uma lista paginada de bens com possibilidade de filtros",
      "operationId": "listarBens",
      "parameters": [
        {
          "name": "nome",
          "in": "query",
          "description": "Filtrar por nome do bem (busca parcial, case-insensitive)",
          "required": false,
          "schema": { "type": "string", "minLength": 1 }
        },
        {
          "name": "patrimonio",
          "in": "query",
          "description": "Filtrar por número de patrimônio",
          "required": false,
          "schema": { "type": "string", "minLength": 1 }
        },
        {
          "name": "page",
          "in": "query",
          "description": "Número da página para paginação",
          "required": false,
          "schema": { "type": "integer", "minimum": 1, "default": 1 }
        },
        {
          "name": "limite",
          "in": "query",
          "description": "Limite de itens por página",
          "required": false,
          "schema": { "type": "integer", "minimum": 1, "maximum": 100, "default": 10 }
        }
      ],
      "responses": {
        "200": {
          "description": "Lista de bens retornada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bens listados com sucesso" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "docs": {
                        "type": "array",
                        "items": { "$ref": "#/components/schemas/BemListagem" }
                      },
                      "totalDocs": { "type": "number" },
                      "limit": { "type": "number" },
                      "totalPages": { "type": "number" },
                      "page": { "type": "number" },
                      "pagingCounter": { "type": "number" },
                      "hasPrevPage": { "type": "boolean" },
                      "hasNextPage": { "type": "boolean" },
                      "prevPage": { "type": "number" },
                      "nextPage": { "type": "number" }
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Parâmetros de consulta inválidos",
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
        "500": { "description": "Erro interno do servidor" }
      }
    },
    "post": {
      "tags": ["Bem"],
      "summary": "Criar um novo bem",
      "description": "Cria um novo bem no sistema",
      "operationId": "criarBem",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/BemPost" }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Bem criado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bem criado com sucesso" },
                  "data": { "$ref": "#/components/schemas/BemDetalhes" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Dados de entrada inválidos",
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
        "409": {
          "description": "Conflito - Bem já existe",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Bem com este patrimônio já existe" }
                }
              }
            }
          }
        },
        "500": { "description": "Erro interno do servidor" }
      }
    }
  },
  "/bens/{id}": {
    "get": {
      "tags": ["Bem"],
      "summary": "Obter bem por ID",
      "description": "Retorna um bem específico pelo seu ID",
      "operationId": "obterBemPorId",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do bem",
          "schema": { "type": "string", "pattern": "^[0-9a-fA-F]{24}$" }
        }
      ],
      "responses": {
        "200": {
          "description": "Bem encontrado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bem encontrado com sucesso" },
                  "data": { "$ref": "#/components/schemas/BemDetalhes" }
                }
              }
            }
          }
        },
        "400": {
          "description": "ID inválido",
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
          "description": "Bem não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Bem não encontrado" }
                }
              }
            }
          }
        },
        "500": { "description": "Erro interno do servidor" }
      }
    },
    "patch": {
      "tags": ["Bem"],
      "summary": "Atualizar bem parcialmente",
      "description": "Atualiza campos específicos de um bem",
      "operationId": "atualizarBemParcial",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do bem",
          "schema": { "type": "string", "pattern": "^[0-9a-fA-F]{24}$" }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/BemPutPatch" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Bem atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bem atualizado com sucesso" },
                  "data": { "$ref": "#/components/schemas/BemDetalhes" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Dados de entrada inválidos ou ID inválido",
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
        "404": {
          "description": "Bem não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Bem não encontrado" }
                }
              }
            }
          }
        },
        "500": { "description": "Erro interno do servidor" }
      }
    },
    "put": {
      "tags": ["Bem"],
      "summary": "Atualizar bem completamente",
      "description": "Substitui todos os dados de um bem",
      "operationId": "atualizarBemCompleto",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do bem",
          "schema": { "type": "string", "pattern": "^[0-9a-fA-F]{24}$" }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/BemPutPatch" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Bem atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bem atualizado com sucesso" },
                  "data": { "$ref": "#/components/schemas/BemDetalhes" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Dados de entrada inválidos ou ID inválido",
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
        "404": {
          "description": "Bem não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Bem não encontrado" }
                }
              }
            }
          }
        },
        "500": { "description": "Erro interno do servidor" }
      }
    },
    "delete": {
      "tags": ["Bem"],
      "summary": "Deletar bem",
      "description": "Remove um bem do sistema",
      "operationId": "deletarBem",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do bem",
          "schema": { "type": "string", "pattern": "^[0-9a-fA-F]{24}$" }
        }
      ],
      "responses": {
        "200": {
          "description": "Bem deletado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Bem deletado com sucesso" },
                  "data": { "$ref": "#/components/schemas/BemDetalhes" }
                }
              }
            }
          }
        },
        "400": {
          "description": "ID inválido",
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
          "description": "Bem não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Bem não encontrado" }
                }
              }
            }
          }
        },
        "500": { "description": "Erro interno do servidor" }
      }
    }
  }
};

export default bemPaths;
