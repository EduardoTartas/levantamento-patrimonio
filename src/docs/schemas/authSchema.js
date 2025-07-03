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

await addExamples();

export default authSchemas;
