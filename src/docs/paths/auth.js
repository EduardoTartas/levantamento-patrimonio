import commonResponses from "../schemas/swaggerCommonResponses.js";

const authPaths = {
  "/login": {
    post: {
      tags: ["Auth"],
      summary: "Realizar login",
      description: `
        + Caso de uso: Autenticação de usuários no sistema.
        
        + Função de Negócio:
            - Permitir que usuários autentiquem no sistema usando email e senha.
            - Retornar tokens JWT de acesso e refresh para autorização.

        + Regras de Negócio:
            - Validar formato do email e presença da senha.
            - Verificar credenciais contra o banco de dados.
            - Gerar tokens JWT válidos com tempo de expiração apropriado.

        + Resultado Esperado:
            - 200 OK com tokens de acesso e refresh.
            - Dados do usuário autenticado.
      `,
      operationId: "login",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/loginPost"
            }
          }
        }
      },
      responses: {
        200: {
          description: "Login realizado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RespostaLogin"
              }
            }
          }
        },
        400: {
          description: "Dados de entrada inválidos",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Email e senha são obrigatórios" }
                }
              }
            }
          }
        },
        401: {
          description: "Credenciais inválidas",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Email ou senha incorretos" }
                }
              }
            }
          }
        },
        500: commonResponses[500]()
      }
    }
  },
  "/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Renovar token de acesso",
      description: `
        + Caso de uso: Renovação de tokens de acesso expirados.
        
        + Função de Negócio:
            - Permitir renovação de tokens JWT usando refresh token.
            - Manter sessões ativas sem necessidade de novo login.

        + Regras de Negócio:
            - Validar refresh token fornecido.
            - Verificar se o refresh token não expirou.
            - Gerar novo access token válido.

        + Resultado Esperado:
            - 200 OK com novo token de acesso.
      `,
      operationId: "refreshToken",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/TokenRefresh"
            }
          }
        }
      },
      responses: {
        200: {
          description: "Token renovado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TokenResponse"
              }
            }
          }
        },
        400: {
          description: "Refresh token não fornecido",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Refresh token é obrigatório" }
                }
              }
            }
          }
        },
        401: {
          description: "Refresh token inválido ou expirado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Refresh token inválido" }
                }
              }
            }
          }
        },
        500: commonResponses[500]()
      }
    }
  },
  "/recover": {
    post: {
      tags: ["Auth"],
      summary: "Recuperar senha",
      description: `
        + Caso de uso: Recuperação de senha esquecida.
        
        + Função de Negócio:
            - Permitir que usuários solicitem recuperação de senha.
            - Enviar email com instruções para redefinir senha.

        + Regras de Negócio:
            - Validar formato do email fornecido.
            - Verificar se usuário existe no sistema.
            - Gerar token temporário para recuperação.

        + Resultado Esperado:
            - 200 OK com confirmação de envio do email.
      `,
      operationId: "recoverPassword",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RequisicaoRecuperaSenha"
            }
          }
        }
      },
      responses: {
        200: {
          description: "Email de recuperação enviado com sucesso",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RespostaRecuperaSenha"
              }
            }
          }
        },
        400: {
          description: "Email não fornecido ou inválido",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Email é obrigatório" }
                }
              }
            }
          }
        },
        404: {
          description: "Usuário não encontrado",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Usuário não encontrado" }
                }
              }
            }
          }
        },
        500: commonResponses[500]()
      }
    }
  },
  "/logout": {
    post: {
      tags: ["Auth"],
      summary: "Realizar logout",
      description: `
        + Caso de uso: Encerramento de sessão de usuário.
        
        + Função de Negócio:
            - Permitir que usuários façam logout do sistema.
            - Invalidar refresh token para segurança.

        + Regras de Negócio:
            - Validar token de autorização.
            - Invalidar refresh token fornecido.
            - Remover sessão ativa do usuário.

        + Resultado Esperado:
            - 200 OK com confirmação de logout.
      `,
      operationId: "logout",
      security: [
        {
          bearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/TokenRefresh"
            }
          }
        }
      },
      responses: {
        200: {
          description: "Logout realizado com sucesso",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Logout realizado com sucesso" }
                }
              }
            }
          }
        },
        400: {
          description: "Refresh token não fornecido",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Refresh token é obrigatório" }
                }
              }
            }
          }
        },
        401: {
          description: "Token de autorização inválido",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Token inválido" }
                }
              }
            }
          }
        },
        500: commonResponses[500]()
      }
    }
  }
};

export default authPaths;
