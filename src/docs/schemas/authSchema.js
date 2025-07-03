import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Definição original do authSchemas
const authSchemas = {
  RespostaRecuperaSenha: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Mensagem indicando o status da recuperação de senha",
        example: "Email enviado com sucesso para recuperação de senha"
      }
    },
  },
  RequisicaoRecuperaSenha: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Endereço de email do usuário para recuperação de senha",
      }
    },
    required: ["email"]
  },
  loginPost: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email do usuário" },
      senha: { type: "string", description: "Senha do usuário" }
    },
    required: ["email", "senha"]
  },
  RespostaPass: {
    type: "object",
    properties: {
      active: { type: "boolean", description: "Indica se o token ainda é válido (não expirado)", example: true, },
      client_id: { type: "string", description: "ID do cliente OAuth", example: "1234567890abcdef", },
      token_type: { type: "string", description: "Tipo de token, conforme RFC 6749", example: "Bearer", },
      exp: { type: "string", description: "Timestamp UNIX de expiração do token", example: 1672531199, },
      iat: { type: "string", description: "Timestamp UNIX de emissão do token", example: 1672527600, },
      nbf: { type: "string", description: "Timestamp UNIX de início de validade do token", example: 1672527600, },
    },
  },
  signupPost: {
    type: "object",
    properties: {
      nome: { type: "string", description: "Nome do usuário" },
      email: { type: "string", format: "email", description: "Email do usuário" },
      senha: { type: "string", description: "Senha do usuário" }
    },
    required: ["nome", "email", "senha"]
  },
  signupPostDestalhes: {
    type: "object",
    properties: {
      _id: { type: "string", description: "ID único do usuário criado" },
      nome: { type: "string", description: "Nome do usuário" },
      email: { type: "string", format: "email", description: "Email do usuário" },
      status: { type: "boolean", description: "Status ativo/inativo do usuário", example: true },
      createdAt: { type: "string", format: "date-time", description: "Data de criação" },
      updatedAt: { type: "string", format: "date-time", description: "Data de última atualização" }
    }
  },
  RespostaLogin: {
    type: "object", 
    properties: {
      success: { type: "boolean", description: "Indica se a operação foi bem-sucedida", example: true },
      message: { type: "string", description: "Mensagem de sucesso ou erro", example: "Login realizado com sucesso" },
      data: {
        type: "object",
        properties: {
          accessToken: { type: "string", description: "Token de acesso JWT" },
          refreshToken: { type: "string", description: "Token de refresh" },
          user: {
            type: "object",
            properties: {
              _id: { type: "string", description: "ID do usuário" },
              nome: { type: "string", description: "Nome do usuário" },
              email: { type: "string", description: "Email do usuário" },
              cargo: { type: "string", description: "Cargo do usuário" },
              status: { type: "boolean", description: "Status do usuário" }
            }
          }
        }
      }
    }
  },
  TokenRefresh: {
    type: "object",
    properties: {
      refreshToken: {
        type: "string",
        description: "Token de refresh para renovar o access token"
      }
    },
    required: ["refreshToken"]
  },
  TokenResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", description: "Novo token de acesso JWT" },
      refreshToken: { type: "string", description: "Novo token de refresh" },
      expiresIn: { type: "number", description: "Tempo de expiração em segundos" }
    }
  }
};

const addExamples = async () => {
  for (const key of Object.keys(authSchemas)) {
    const schema = authSchemas[key];
    if (schema.properties) {
      for (const [propKey, propertySchema] of Object.entries(schema.properties)) {
        propertySchema.example = await generateExample(propertySchema, propKey);
      }
    }
    schema.example = await generateExample(schema);
  }
};

// Inicializa exemplos de forma assíncrona
addExamples().catch(console.error);

export default authSchemas;
