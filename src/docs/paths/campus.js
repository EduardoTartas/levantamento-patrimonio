import commonResponses from "../schemas/swaggerCommonResponses.js";

const campusPaths = {
  "/campus": {
    get: {
      tags: ["Campus"],
      summary: "Listar campus",
      description: `
        + Caso de uso: Listagem de campus para consulta e gestão.
        
        + Função de Negócio:
            - Permitir consulta paginada de campus cadastrados no sistema.
            - Aplicar filtros por nome, cidade e status ativo.
            - Fornecer dados para relatórios e controle administrativo.

        + Regras de Negócio:
            - Validar parâmetros de filtro fornecidos.
            - Aplicar paginação conforme limites estabelecidos.
            - Retornar apenas campus que o usuário tem permissão para visualizar.

        + Resultado Esperado:
            - 200 OK com lista paginada de campus conforme filtros aplicados.
      `,
      operationId: "listarCampus",
      parameters: [
        {
          name: "nome",
          in: "query",
          description: "Filtrar por nome do campus (busca parcial, case-insensitive)",
          required: false,
          schema: {
            type: "string",
            minLength: 1
          }
        },
        {
          name: "cidade",
          in: "query",
          description: "Filtrar por cidade do campus (busca parcial, case-insensitive)",
          required: false,
          schema: {
            type: "string",
            minLength: 1
          }
        },
        {
          name: "ativo",
          in: "query",
          description: "Filtrar por status ativo/inativo do campus",
          required: false,
          schema: {
            type: "string",
            enum: ["true", "false"]
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
      responses: {
        200: {
          description: "Lista de campus retornada com sucesso",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Campus listados com sucesso" },
                  data: {
                    type: "object",
                    properties: {
                      docs: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/CampusListagem"
                        }
                      },
                      totalDocs: { type: "number" },
                      limit: { type: "number" },
                      totalPages: { type: "number" },
                      page: { type: "number" },
                      pagingCounter: { type: "number" },
                      hasPrevPage: { type: "boolean" },
                      hasNextPage: { type: "boolean" },
                      prevPage: { type: "number" },
                      nextPage: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: "Parâmetros de consulta inválidos",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Erro de validação" }
                }
              }
            }
          }
        },
        500: {
          description: "Erro interno do servidor"
        }
      }
    },
    post: {
      tags: ["Campus"],
      summary: "Criar novo campus",
      description: `
        + Caso de uso: Cadastro de novos campus no sistema.
        
        + Função de Negócio:
            - Permitir criação de novos campus com dados completos.
            - Validar informações obrigatórias antes da criação.

        + Regras de Negócio:
            - Nome do campus deve ser único por cidade.
            - Campos obrigatórios devem ser preenchidos.
            - Validar formato dos dados de entrada.

        + Resultado Esperado:
            - 201 Created com dados do campus criado.
      `,
      operationId: "criarCampus",
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
    get: {
      tags: ["Campus"],
      summary: "Obter campus por ID",
      description: `
        + Caso de uso: Consulta de dados específicos de um campus.
        
        + Função de Negócio:
            - Retornar informações completas de um campus específico.
            - Permitir consulta por ID único.

        + Regras de Negócio:
            - ID deve ser um ObjectId válido.
            - Campus deve existir no sistema.
            - Retornar erro 404 se não encontrado.

        + Resultado Esperado:
            - 200 OK com dados completos do campus.
      `,
      operationId: "obterCampusPorId",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
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
    patch: {
      tags: ["Campus"],
      summary: "Atualizar campus parcialmente",
      description: `
        + Caso de uso: Atualização parcial de dados de campus.
        
        + Função de Negócio:
            - Permitir atualização de campos específicos de um campus.
            - Manter campos não informados inalterados.

        + Regras de Negócio:
            - ID deve ser válido e campus deve existir.
            - Validar apenas campos informados.
            - Nome deve permanecer único por cidade.

        + Resultado Esperado:
            - 200 OK com dados atualizados do campus.
      `,
      operationId: "atualizarCampusParcial",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
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
    put: {
      tags: ["Campus"],
      summary: "Atualizar campus completamente",
      description: `
        + Caso de uso: Substituição completa de dados de campus.
        
        + Função de Negócio:
            - Permitir substituição total dos dados de um campus.
            - Todos os campos devem ser fornecidos.

        + Regras de Negócio:
            - ID deve ser válido e campus deve existir.
            - Todos os campos obrigatórios devem ser fornecidos.
            - Nome deve permanecer único por cidade.

        + Resultado Esperado:
            - 200 OK com dados completamente atualizados.
      `,
      operationId: "atualizarCampusCompleto",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
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
    delete: {
      tags: ["Campus"],
      summary: "Excluir campus",
      description: `
        + Caso de uso: Remoção de campus do sistema.
        
        + Função de Negócio:
            - Permitir exclusão de campus não utilizados.
            - Verificar dependências antes da exclusão.

        + Regras de Negócio:
            - Campus não pode ter usuários associados.
            - Campus não pode ter salas associadas.
            - ID deve ser válido e campus deve existir.

        + Resultado Esperado:
            - 200 OK com confirmação da exclusão.
      `,
      operationId: "excluirCampus",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do campus",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
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
