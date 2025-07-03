// schemas/refeicoesSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Refeicoes from '../../models/Refeicao.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const refeicoesJsonSchema = Refeicoes.schema.jsonSchema();

// Remove campos que não queremos na base original
delete refeicoesJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const refeicoesSchemas = {
  RefeicoesFiltro: {
    type: "object",
    properties: {
      estudante: refeicoesJsonSchema.properties.estudante,
      data: refeicoesJsonSchema.properties.data,
      tipoRefeicao: refeicoesJsonSchema.properties.tipoRefeicao,
      usuarioRegistrou: refeicoesJsonSchema.properties.usuarioRegistrou,
    }
  },
  RefeicoesListagem: {
    ...deepCopy(refeicoesJsonSchema),
    description: "Schema para listagem de usuários"
  },
  RefeicoesDetalhes: {
    ...deepCopy(refeicoesJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  RefeicoesPost: {
    ...deepCopy(refeicoesJsonSchema),
    description: "Schema para criação de usuário"
  },
  RefeicoesPutPatch: {
    ...deepCopy(refeicoesJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  RefeicoesListagem: ['__v'],
  RefeicoesDetalhes: ['__v'],
  RefeicoesPost: ['createdAt', 'updatedAt', '__v', '_id'],
  RefeicoesPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (refeicoesSchemas[schemaKey]) {
    removeFieldsRecursively(refeicoesSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const refeicoesMongooseSchema = Refeicoes.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
refeicoesSchemas.RefeicoesListagem.example = await generateExample(refeicoesSchemas.RefeicoesListagem, null, refeicoesMongooseSchema);
refeicoesSchemas.RefeicoesDetalhes.example = await generateExample(refeicoesSchemas.RefeicoesDetalhes, null, refeicoesMongooseSchema);
refeicoesSchemas.RefeicoesPost.example = await generateExample(refeicoesSchemas.RefeicoesPost, null, refeicoesMongooseSchema);
refeicoesSchemas.RefeicoesPutPatch.example = await generateExample(refeicoesSchemas.RefeicoesPutPatch, null, refeicoesMongooseSchema);

export default refeicoesSchemas;
