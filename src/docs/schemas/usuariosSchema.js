// schemas/usuariosSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Usuario from '../../models/Usuario.js';
import Grupo from '../../models/Grupo.js';
import Unidade from '../../models/Unidade.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const usuarioJsonSchema = Usuario.schema.jsonSchema();
const grupoJsonSchema = Grupo.schema.jsonSchema();
const unidadeJsonSchema = Unidade.schema.jsonSchema();

// Remove campos que não queremos na base original
delete usuarioJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const usuariosSchemas = {
  UsuarioFiltro: {
    type: "object",
    properties: {
      nome: usuarioJsonSchema.properties.nome,
      email: usuarioJsonSchema.properties.email,
      ativo: usuarioJsonSchema.properties.ativo,
      grupo: grupoJsonSchema.properties.nome,
      unidade: unidadeJsonSchema.properties.nome,
    }
  },
  UsuarioListagem: {
    ...deepCopy(usuarioJsonSchema),
    description: "Schema para listagem de usuários"
  },
  UsuarioDetalhes: {
    ...deepCopy(usuarioJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  UsuarioPost: {
    ...deepCopy(usuarioJsonSchema),
    required: ["nome", "email"],
    description: "Schema para criação de usuário"
  },
  UsuarioPutPatch: {
    ...deepCopy(usuarioJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  },
  UsuarioLogin: {
    ...deepCopy(usuarioJsonSchema),
    required: ["email", "senha"],
    description: "Schema para login de usuário"
  },
  UsuarioRespostaLogin: {
    ...deepCopy(usuarioJsonSchema),
    description: "Schema para resposta de login de usuário"
  },
  signupPost: {
    ...deepCopy(usuarioJsonSchema),
    required: ["nome", "email", "senha"],
    description: "Schema para cadastro de usuário"
  },
  signupPostDestalhes: {
    ...deepCopy(usuarioJsonSchema),
    required: ["nome", "email", "senha"],
    description: "Schema para detalhes do cadastro de usuário"
  }

};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  UsuarioListagem: ['accesstoken', 'refreshtoken', 'tokenUnico', 'senha', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  UsuarioDetalhes: ['accesstoken', 'tokenUnico', 'refreshtoken', 'senha', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  UsuarioPost: ['accesstoken', 'refreshtoken', 'tokenUnico', 'createdAt', 'updatedAt', '__v', '_id', 'senha', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  UsuarioPutPatch: ['accesstoken', 'refreshtoken', 'tokenUnico', 'senha', 'email', 'createdAt', 'updatedAt', '__v', '_id', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  UsuarioLogin: ['tokenUnico', 'senha', '__v', '_id', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  UsuarioRespostaLogin: ['tokenUnico', 'senha', 'createdAt', 'updatedAt', '__v', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  signupPost: ['accesstoken', 'refreshtoken', 'tokenUnico', 'createdAt', 'updatedAt', '__v', '_id', 'ativo', 'permissoes', 'grupos', 'unidades', 'codigo_recupera_senha', 'exp_codigo_recupera_senha'],
  signupPostDestalhes: ['accesstoken', 'refreshtoken', 'tokenUnico', 'createdAt', 'updatedAt', '__v', '_id', 'ativo', 'permissoes', 'grupos', 'unidades', 'codigo_recupera_senha', 'exp_codigo_recupera_senha', 'senha']
}

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (usuariosSchemas[schemaKey]) {
    removeFieldsRecursively(usuariosSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const usuarioMongooseSchema = Usuario.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
usuariosSchemas.UsuarioListagem.example = await generateExample(usuariosSchemas.UsuarioListagem, null, usuarioMongooseSchema);
usuariosSchemas.UsuarioDetalhes.example = await generateExample(usuariosSchemas.UsuarioDetalhes, null, usuarioMongooseSchema);
usuariosSchemas.UsuarioPost.example = await generateExample(usuariosSchemas.UsuarioPost, null, usuarioMongooseSchema);
usuariosSchemas.signupPost.example = await generateExample(usuariosSchemas.signupPost, null, usuarioMongooseSchema);
usuariosSchemas.UsuarioPutPatch.example = await generateExample(usuariosSchemas.UsuarioPutPatch, null, usuarioMongooseSchema);
usuariosSchemas.UsuarioLogin.example = await generateExample(usuariosSchemas.UsuarioLogin, null, usuarioMongooseSchema);
usuariosSchemas.UsuarioRespostaLogin.example = await generateExample(usuariosSchemas.UsuarioRespostaLogin, null, usuarioMongooseSchema);


/**
 * Schemas personalizados para upload/download de foto de usuário, não há como automatizar
 */
usuariosSchemas.UsuarioFotoPayload = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Mensagem de sucesso da operação de upload",
      example: "Arquivo recebido e usuário atualizado com sucesso."
    },
    dados: {
      type: "object",
      description: "Dados atualizados do usuário",
      properties: {
        link_foto: {
          type: "string",
          description: "Nome do arquivo de foto salvo",
          example: "c25069f4-d07b-4836-97a1-2c600b67f9f2.jpg"
        }
      },
      required: ["link_foto"]
    },
    metadados: {
      type: "object",
      description: "Informações técnicas sobre o arquivo enviado",
      properties: {
        fileName: {
          type: "string",
          example: "c25069f4-d07b-4836-97a1-2c600b67f9f2.jpg"
        },
        fileExtension: {
          type: "string",
          example: "jpg"
        },
        fileSize: {
          type: "integer",
          example: 121421
        },
        md5: {
          type: "string",
          example: "1bd822a4b1ca3c6224b5be5ef330ebdf"
        }
      },
      required: ["fileName", "fileExtension", "fileSize", "md5"]
    }
  },
  required: ["message", "dados", "metadados"],
  description: "Payload de resultado de upload de foto de usuário"
};

export default usuariosSchemas;