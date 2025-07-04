const inventarioPaths = {
  "/inventarios": {
    "get": {
      "tags": ["Inventários"],
      "summary": "Listar inventários",
      "description": "Retorna uma lista paginada de inventários com possibilidade de filtros",
      "operationId": "listarInventarios",
      "parameters": [
        {
          "name": "nome",
          "in": "query",
          "description": "Filtrar por nome do inventário (busca parcial, case-insensitive)",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1
          }
        },
        {
          "name": "ativo",
          "in": "query",
          "description": "Filtrar por status ativo/inativo do inventário",
          "required": false,
          "schema": {
            "type": "string",
            "enum": ["true", "false"]
          }
        },
        {
          "name": "data",
          "in": "query",
          "description": "Filtrar por data do inventário (formato DD/MM/YYYY)",
          "required": false,
          "schema": {
            "type": "string",
            "pattern": "^\\d{2}/\\d{2}/\\d{4}$"
          }
        },
        {
          "name": "page",
          "in": "query",
          "description": "Número da página para paginação",
          "required": false,
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
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
          "description": "Lista de inventários retornada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventários listados com sucesso" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "docs": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/InventarioListagem"
                        }
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
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    },
    "post": {
      "tags": ["Inventários"],
      "summary": "Criar um novo inventário",
      "description": "Cria um novo inventário no sistema",
      "operationId": "criarInventario",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/InventarioPost"
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Inventário criado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventário criado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/InventarioDetalhes"
                  }
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
        "404": {
          "description": "Campus não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Campus não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    }
  },
  "/inventarios/{id}": {
    "get": {
      "tags": ["Inventários"],
      "summary": "Obter inventário por ID",
      "description": "Retorna um inventário específico pelo seu ID",
      "operationId": "obterInventarioPorId",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do inventário",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Inventário encontrado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventário encontrado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/InventarioDetalhes"
                  }
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
          "description": "Inventário não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Inventário não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    },
    "patch": {
      "tags": ["Inventários"],
      "summary": "Atualizar inventário parcialmente",
      "description": "Atualiza campos específicos de um inventário",
      "operationId": "atualizarInventarioParcial",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do inventário",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/InventarioPutPatch"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Inventário atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventário atualizado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/InventarioDetalhes"
                  }
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
          "description": "Inventário não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Inventário não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    },
    "put": {
      "tags": ["Inventários"],
      "summary": "Atualizar inventário completamente",
      "description": "Substitui todos os dados de um inventário",
      "operationId": "atualizarInventarioCompleto",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do inventário",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/InventarioPutPatch"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Inventário atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventário atualizado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/InventarioDetalhes"
                  }
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
          "description": "Inventário não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Inventário não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    },
    "delete": {
      "tags": ["Inventários"],
      "summary": "Deletar inventário",
      "description": "Remove um inventário do sistema",
      "operationId": "deletarInventario",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do inventário",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Inventário deletado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Inventário deletado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/InventarioDetalhes"
                  }
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
          "description": "Inventário não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Inventário não encontrado" }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor"
        }
      }
    }
  }
};

export default inventarioPaths;
