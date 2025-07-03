// schemas/usuariosSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Usuario from '../../models/Usuario.js';
import Campus from '../../models/Campus.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const usuarioJsonSchema = Usuario.schema.jsonSchema();
const campusJsonSchema = Campus.schema.jsonSchema();

// Remove campos que não queremos na base original
delete usuarioJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const usuariosSchemas = {
  UsuarioFiltro: {
    type: "object",
    properties: {
      nome: usuarioJsonSchema.properties.nome,
      email: usuarioJsonSchema.properties.email,
      cpf: usuarioJsonSchema.properties.cpf,
      cargo: usuarioJsonSchema.properties.cargo,
      status: usuarioJsonSchema.properties.status,
      campus: campusJsonSchema.properties.nome,
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
    required: ["nome", "email", "cpf", "campus", "cargo"],
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
  CadastrarSenha: {
    type: "object",
    properties: {
      senha: {
        type: "string",
        minLength: 6,
        description: "Nova senha do usuário"
      }
    },
    required: ["senha"],
    description: "Schema para cadastro de nova senha"
  },
  CadastrarSenhaResposta: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Senha definida com sucesso."
      },
      success: {
        type: "boolean",
        example: true
      }
    },
    description: "Schema para resposta do cadastro de senha"
  }

};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  UsuarioListagem: ['senha', 'senhaToken', 'senhaTokenExpira'],
  UsuarioDetalhes: ['senha', 'senhaToken', 'senhaTokenExpira'],
  UsuarioPost: ['createdAt', 'updatedAt', '__v', '_id', 'senha', 'senhaToken', 'senhaTokenExpira'],
  UsuarioPutPatch: ['senha', 'email', 'createdAt', 'updatedAt', '__v', '_id', 'senhaToken', 'senhaTokenExpira'],
  UsuarioLogin: ['__v', '_id', 'senhaToken', 'senhaTokenExpira', 'createdAt', 'updatedAt', 'campus', 'cpf', 'cargo', 'status'],
  UsuarioRespostaLogin: ['senha', 'createdAt', 'updatedAt', '__v', 'senhaToken', 'senhaTokenExpira']
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
const addExamples = async () => {
  usuariosSchemas.UsuarioListagem.example = await generateExample(usuariosSchemas.UsuarioListagem, null, usuarioMongooseSchema);
  usuariosSchemas.UsuarioDetalhes.example = await generateExample(usuariosSchemas.UsuarioDetalhes, null, usuarioMongooseSchema);
  usuariosSchemas.UsuarioPost.example = await generateExample(usuariosSchemas.UsuarioPost, null, usuarioMongooseSchema);
  usuariosSchemas.UsuarioPutPatch.example = await generateExample(usuariosSchemas.UsuarioPutPatch, null, usuarioMongooseSchema);
  usuariosSchemas.UsuarioLogin.example = await generateExample(usuariosSchemas.UsuarioLogin, null, usuarioMongooseSchema);
  usuariosSchemas.UsuarioRespostaLogin.example = await generateExample(usuariosSchemas.UsuarioRespostaLogin, null, usuarioMongooseSchema);
};

// Inicializa exemplos de forma assíncrona
addExamples().catch(console.error);


export default usuariosSchemas;