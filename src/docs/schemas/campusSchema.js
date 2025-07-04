// schemas/campusSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Campus from '../../models/Campus.js';

// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir do schema do modelo
const campusJsonSchema = Campus.schema.jsonSchema();

// Remove campos que não queremos na base original
delete campusJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const campusSchemas = {
  CampusFiltro: {
    type: "object",
    properties: {
      nome: {
        type: "string",
        description: "Filtrar por nome do campus (busca parcial, case-insensitive)"
      },
      cidade: {
        type: "string",
        description: "Filtrar por cidade do campus (busca parcial, case-insensitive)"
      },
      ativo: {
        type: "string",
        enum: ["true", "false"],
        description: "Filtrar por status ativo/inativo do campus"
      },
      page: {
        type: "integer",
        minimum: 1,
        default: 1,
        description: "Número da página para paginação"
      },
      limite: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 10,
        description: "Limite de itens por página"
      }
    },
    description: "Schema para filtro de campus"
  },
  CampusListagem: {
    ...deepCopy(campusJsonSchema),
    description: "Schema para listagem de campus"
  },
  CampusDetalhes: {
    ...deepCopy(campusJsonSchema),
    description: "Schema para detalhes de um campus"
  },
  CampusPost: {
    ...deepCopy(campusJsonSchema),
    required: ["nome", "cidade"],
    description: "Schema para criação de campus"
  },
  CampusPutPatch: {
    ...deepCopy(campusJsonSchema),
    required: [],
    description: "Schema para atualização de campus"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  CampusListagem: [],
  CampusDetalhes: [],
  CampusPost: ['createdAt', 'updatedAt', '__v', '_id'],
  CampusPutPatch: ['createdAt', 'updatedAt', '__v', '_id']
}

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (campusSchemas[schemaKey]) {
    removeFieldsRecursively(campusSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const campusMongooseSchema = Campus.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
const addExamples = async () => {
  campusSchemas.CampusFiltro.example = await generateExample(campusSchemas.CampusFiltro, null, campusMongooseSchema);
  campusSchemas.CampusListagem.example = await generateExample(campusSchemas.CampusListagem, null, campusMongooseSchema);
  campusSchemas.CampusDetalhes.example = await generateExample(campusSchemas.CampusDetalhes, null, campusMongooseSchema);
  campusSchemas.CampusPost.example = await generateExample(campusSchemas.CampusPost, null, campusMongooseSchema);
  campusSchemas.CampusPutPatch.example = await generateExample(campusSchemas.CampusPutPatch, null, campusMongooseSchema);
};

// Inicializa exemplos de forma assíncrona
addExamples().catch(console.error);

export default campusSchemas;
