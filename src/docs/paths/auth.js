const authPaths = {
  "/login": {
    "post": {
      "tags": ["Auth"],
      "summary": "Realiza login do usuário",
      "description": "Autentica um usuário com email e senha, retornando tokens de acesso e refresh",
      "operationId": "login",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/loginPost"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Login realizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RespostaLogin"
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
                  "message": { "type": "string", "example": "Email e senha são obrigatórios" }
                }
              }
            }
          }
        },
        "401": {
          "description": "Credenciais inválidas",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Email ou senha incorretos" }
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
  "/refresh": {
    "post": {
      "tags": ["Auth"],
      "summary": "Renovar token de acesso",
      "description": "Gera um novo token de acesso usando o refresh token",
      "operationId": "refreshToken",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/TokenRefresh"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Token renovado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TokenResponse"
              }
            }
          }
        },
        "400": {
          "description": "Refresh token não fornecido",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Refresh token é obrigatório" }
                }
              }
            }
          }
        },
        "401": {
          "description": "Refresh token inválido ou expirado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Refresh token inválido" }
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
  "/recover": {
    "post": {
      "tags": ["Auth"],
      "summary": "Solicitar recuperação de senha",
      "description": "Envia um email para recuperação de senha do usuário",
      "operationId": "recoverPassword",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/RequisicaoRecuperaSenha"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Email de recuperação enviado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RespostaRecuperaSenha"
              }
            }
          }
        },
        "400": {
          "description": "Email não fornecido ou inválido",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Email é obrigatório" }
                }
              }
            }
          }
        },
        "404": {
          "description": "Usuário não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Usuário não encontrado" }
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
  "/logout": {
    "post": {
      "tags": ["Auth"],
      "summary": "Fazer logout do usuário",
      "description": "Invalida o refresh token do usuário, fazendo logout",
      "operationId": "logout",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/TokenRefresh"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Logout realizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "message": { "type": "string", "example": "Logout realizado com sucesso" }
                }
              }
            }
          }
        },
        "400": {
          "description": "Refresh token não fornecido",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Refresh token é obrigatório" }
                }
              }
            }
          }
        },
        "401": {
          "description": "Token de autorização inválido",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": false },
                  "message": { "type": "string", "example": "Token inválido" }
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

export default authPaths;
