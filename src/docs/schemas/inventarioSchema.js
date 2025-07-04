// schemas/inventarioSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Inventario from '../../models/Inventario.js';

// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir do schema do modelo
const inventarioJsonSchema = Inventario.schema.jsonSchema();

// Remove campos que não queremos na base original
delete inventarioJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const inventarioSchemas = {
  InventarioFiltro: {
    type: "object",
    properties: {
      nome: {
        type: "string",
        description: "Filtrar por nome do inventário (busca parcial, case-insensitive)"
      },
      ativo: {
        type: "string",
        enum: ["true", "false"],
        description: "Filtrar por status ativo/inativo do inventário"
      },
      data: {
        type: "string",
        description: "Filtrar por data do inventário (formato DD/MM/YYYY)"
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
    description: "Schema para filtro de inventários"
  },
  InventarioListagem: {
    ...deepCopy(inventarioJsonSchema),
    description: "Schema para listagem de inventários"
  },
  InventarioDetalhes: {
    ...deepCopy(inventarioJsonSchema),
    description: "Schema para detalhes de um inventário"
  },
  InventarioPost: {
    ...deepCopy(inventarioJsonSchema),
    required: ["nome", "data", "campus"],
    description: "Schema para criação de inventário"
  },
  InventarioPutPatch: {
    ...deepCopy(inventarioJsonSchema),
    required: [],
    description: "Schema para atualização de inventário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  InventarioListagem: [],
  InventarioDetalhes: [],
  InventarioPost: ['createdAt', 'updatedAt', '__v', '_id'],
  InventarioPutPatch: ['createdAt', 'updatedAt', '__v', '_id']
}

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (inventarioSchemas[schemaKey]) {
    removeFieldsRecursively(inventarioSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const inventarioMongooseSchema = Inventario.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
const addExamples = async () => {
  inventarioSchemas.InventarioListagem.example = await generateExample(inventarioSchemas.InventarioListagem, null, inventarioMongooseSchema);
  inventarioSchemas.InventarioDetalhes.example = await generateExample(inventarioSchemas.InventarioDetalhes, null, inventarioMongooseSchema);
  inventarioSchemas.InventarioPost.example = await generateExample(inventarioSchemas.InventarioPost, null, inventarioMongooseSchema);
  inventarioSchemas.InventarioPutPatch.example = await generateExample(inventarioSchemas.InventarioPutPatch, null, inventarioMongooseSchema);
};

// Inicializa exemplos de forma assíncrona
addExamples().catch(console.error);

export default inventarioSchemas;
