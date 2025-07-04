const campusPaths = {
  "/campus": {
    "get": {
      "tags": ["Campus"],
      "summary": "Listar campus",
      "description": "Retorna uma lista paginada de campus com possibilidade de filtros",
      "operationId": "listarCampus",
      "parameters": [
        {
          "name": "nome",
          "in": "query",
          "description": "Filtrar por nome do campus (busca parcial, case-insensitive)",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1
          }
        },
        {
          "name": "cidade",
          "in": "query",
          "description": "Filtrar por cidade do campus (busca parcial, case-insensitive)",
          "required": false,
          "schema": {
            "type": "string",
            "minLength": 1
          }
        },
        {
          "name": "ativo",
          "in": "query",
          "description": "Filtrar por status ativo/inativo do campus",
          "required": false,
          "schema": {
            "type": "string",
            "enum": ["true", "false"]
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
          "description": "Lista de campus retornada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus listados com sucesso" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "docs": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/CampusListagem"
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
      "tags": ["Campus"],
      "summary": "Criar um novo campus",
      "description": "Cria um novo campus no sistema",
      "operationId": "criarCampus",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/CampusPost"
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Campus criado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus criado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/CampusDetalhes"
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
        "409": {
          "description": "Conflito - Campus já existe",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Campus com este nome e cidade já existe" }
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
  "/campus/{id}": {
    "get": {
      "tags": ["Campus"],
      "summary": "Obter campus por ID",
      "description": "Retorna um campus específico pelo seu ID",
      "operationId": "obterCampusPorId",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$",
            "example": "507f1f77bcf86cd799439011"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Campus encontrado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus encontrado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/CampusDetalhes"
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
    },
    "patch": {
      "tags": ["Campus"],
      "summary": "Atualizar campus parcialmente",
      "description": "Atualiza campos específicos de um campus",
      "operationId": "atualizarCampusParcial",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$",
            "example": "507f1f77bcf86cd799439011"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/CampusPutPatch"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Campus atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus atualizado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/CampusDetalhes"
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
    },
    "put": {
      "tags": ["Campus"],
      "summary": "Atualizar campus completamente",
      "description": "Substitui todos os dados de um campus",
      "operationId": "atualizarCampusCompleto",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$",
            "example": "507f1f77bcf86cd799439011"
          }
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/CampusPutPatch"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Campus atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus atualizado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/CampusDetalhes"
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
    },
    "delete": {
      "tags": ["Campus"],
      "summary": "Deletar campus",
      "description": "Remove um campus do sistema (apenas se não houver usuários associados)",
      "operationId": "deletarCampus",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$",
            "example": "507f1f77bcf86cd799439011"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Campus deletado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Campus deletado com sucesso" },
                  "data": {
                    "$ref": "#/components/schemas/CampusDetalhes"
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "ID inválido ou campus possui usuários associados",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Não é possível deletar campus com usuários associados" }
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
  }
};

export default campusPaths;
