const relatorioPaths = {
  "/relatorios": {
    "get": {
      "tags": ["Relatórios"],
      "summary": "Gerar relatório PDF",
      "description": "Gera e retorna um relatório em PDF baseado no inventário e tipo especificados. O arquivo PDF é retornado diretamente como resposta.",
      "operationId": "gerarRelatorio",
      "parameters": [
        {
          "name": "inventarioId",
          "in": "query",
          "description": "ID do inventário para gerar o relatório (obrigatório)",
          "required": true,
          "schema": {
            "type": "string",
            "format": "ObjectId",
            "minLength": 24,
            "maxLength": 24,
            "pattern": "^[0-9a-fA-F]{24}$"
          },
          "example": "507f1f77bcf86cd799439011"
        },
        {
          "name": "tipoRelatorio",
          "in": "query", 
          "description": "Tipo de relatório a ser gerado (obrigatório)",
          "required": true,
          "schema": {
            "type": "string",
            "enum": [
              "geral",
              "bens_danificados",
              "bens_inserviveis", 
              "bens_ociosos",
              "bens_nao_encontrados",
              "bens_sem_etiqueta"
            ]
          },
          "example": "geral"
        },
        {
          "name": "sala",
          "in": "query",
          "description": "ID da sala para filtrar o relatório (opcional)",
          "required": false,
          "schema": {
            "type": "string",
            "format": "ObjectId",
            "minLength": 24,
            "maxLength": 24,
            "pattern": "^[0-9a-fA-F]{24}$"
          },
          "example": "507f1f77bcf86cd799439012"
        }
      ],
      "responses": {
        "200": {
          "description": "Relatório PDF gerado com sucesso",
          "headers": {
            "Content-Type": {
              "description": "Tipo do conteúdo retornado",
              "schema": {
                "type": "string",
                "example": "application/pdf"
              }
            },
            "Content-Disposition": {
              "description": "Disposição do arquivo para download",
              "schema": {
                "type": "string", 
                "example": "attachment; filename=relatorio.pdf"
              }
            }
          },
          "content": {
            "application/pdf": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioResponse"
              },
              "example": "Binary PDF content"
            }
          }
        },
        "400": {
          "description": "Parâmetros inválidos ou obrigatórios ausentes",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioError"
              },
              "examples": {
                "parametros_obrigatorios": {
                  "summary": "Parâmetros obrigatórios ausentes",
                  "value": {
                    "success": false,
                    "message": "inventarioId e tipoRelatorio são obrigatórios.",
                    "error": "Parâmetros inválidos"
                  }
                },
                "tipo_invalido": {
                  "summary": "Tipo de relatório inválido",
                  "value": {
                    "success": false,
                    "message": "Tipo de relatório inválido. Valores aceitos: geral, bens_danificados, bens_inserviveis, bens_ociosos, bens_nao_encontrados, bens_sem_etiqueta",
                    "error": "Tipo de relatório inválido"
                  }
                },
                "inventario_invalido": {
                  "summary": "InventarioId inválido",
                  "value": {
                    "success": false,
                    "message": "inventarioId deve ser um ObjectId válido",
                    "error": "Parâmetros inválidos"
                  }
                },
                "sala_invalida": {
                  "summary": "Sala ID inválido",
                  "value": {
                    "success": false,
                    "message": "sala deve ser um ObjectId válido",
                    "error": "Parâmetros inválidos"
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Inventário ou sala não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioError"
              },
              "examples": {
                "inventario_nao_encontrado": {
                  "summary": "Inventário não encontrado",
                  "value": {
                    "success": false,
                    "message": "Inventário não encontrado",
                    "error": "Recurso não encontrado"
                  }
                },
                "sala_nao_encontrada": {
                  "summary": "Sala não encontrada",
                  "value": {
                    "success": false,
                    "message": "Sala não encontrada",
                    "error": "Recurso não encontrado"
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Token de autenticação ausente ou inválido",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioError"
              },
              "example": {
                "success": false,
                "message": "Token de acesso requerido",
                "error": "Não autorizado"
              }
            }
          }
        },
        "403": {
          "description": "Usuário sem permissão para acessar relatórios",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioError"
              },
              "example": {
                "success": false,
                "message": "Acesso negado",
                "error": "Permissão insuficiente"
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor ao gerar relatório",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RelatorioError"
              },
              "example": {
                "success": false,
                "message": "Erro interno do servidor ao gerar relatório",
                "error": "Erro interno"
              }
            }
          }
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

export default relatorioPaths;
