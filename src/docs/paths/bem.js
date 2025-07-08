import commonResponses from "../schemas/swaggerCommonResponses.js";

const bemPaths = {
  "/bens": {
    get: {
      tags: ["Bem"],
      summary: "Listar bens patrimoniais",
      description: `
        + Caso de uso: Listagem de bens patrimoniais para consulta e gestão.
        
        + Função de Negócio:
            - Permitir consulta paginada de bens cadastrados no sistema.
            - Aplicar filtros por nome, tombo, sala e status de auditoria.
            - Fornecer dados para relatórios e controle patrimonial.

        + Regras de Negócio:
            - Validar parâmetros de filtro fornecidos.
            - Aplicar paginação conforme limites estabelecidos.
            - Retornar apenas bens que o usuário tem permissão para visualizar.

        + Resultado Esperado:
            - 200 OK com lista paginada de bens conforme filtros aplicados.
      `,
      operationId: "listarBens",
      parameters: [
        {
          name: "nome",
          in: "query",
          description: "Filtrar por nome do bem (busca parcial, case-insensitive)",
          required: false,
          schema: { type: "string", minLength: 1 }
        },
        {
          name: "tombo",
          in: "query",
          description: "Filtrar por número de tombo",
          required: false,
          schema: { type: "string", minLength: 1 }
        },
        {
          name: "sala",
          in: "query",
          description: "Filtrar por sala (ID ou nome)",
          required: false,
          schema: { type: "string", minLength: 1 }
        },
        {
          name: "auditado",
          in: "query",
          description: "Filtrar por status de auditoria",
          required: false,
          schema: { type: "string", enum: ["true", "false"] }
        },
        {
          name: "page",
          in: "query",
          description: "Número da página para paginação",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 }
        },
        {
          name: "limite",
          in: "query",
          description: "Limite de itens por página",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 }
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
                      "totalDocs": { "type": "integer", "example": 50 },
                      "limit": { "type": "integer", "example": 10 },
                      "totalPages": { "type": "integer", "example": 5 },
                      "page": { "type": "integer", "example": 1 },
                      "pagingCounter": { "type": "integer", "example": 1 },
                      "hasPrevPage": { "type": "boolean", "example": false },
                      "hasNextPage": { "type": "boolean", "example": true },
                      "prevPage": { "type": "integer", "nullable": true, "example": null },
                      "nextPage": { "type": "integer", "nullable": true, "example": 2 }
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
                  "message": { "type": "string", "example": "Parâmetros inválidos" }
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
      "description": "Retorna os detalhes de um bem específico",
      "operationId": "buscarBemPorId",
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
    }
  }
};

export default bemPaths;
