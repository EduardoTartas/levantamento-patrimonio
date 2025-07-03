// schemas/turmasSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import RefeicaoTurma from '../../models/RefeicaoTurma.js';



// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const refeicoesTurmaJsonSchema = RefeicaoTurma.schema.jsonSchema();

// Remove campos que não queremos na base original
delete refeicoesTurmaJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const refeicoesTurmasSchemas = {
  RefeicoesTurmaFiltro: {
    type: "object",
    properties: {
      turma: refeicoesTurmaJsonSchema.properties.turma,
      data_liberado: refeicoesTurmaJsonSchema.properties.data_liberado,
      descricao: refeicoesTurmaJsonSchema.properties.descricao,
    }
  },
  RefeicoesTurmaListagem: {
    ...deepCopy(refeicoesTurmaJsonSchema),
    description: "Schema para listagem de usuários"
  },
  RefeicoesTurmaDetalhes: {
    ...deepCopy(refeicoesTurmaJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  RefeicoesTurmaPost: {
    ...deepCopy(refeicoesTurmaJsonSchema),
    description: "Schema para criação de usuário"
  },
  RefeicoesTurmaPutPatch: {
    ...deepCopy(refeicoesTurmaJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  RefeicoesTurmaListagem: ['__v'],
  RefeicoesTurmaDetalhes: ['__v'],
  RefeicoesTurmaPost: ['createdAt', 'updatedAt', '__v', '_id'],
  RefeicoesTurmaPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (refeicoesTurmasSchemas[schemaKey]) {
    removeFieldsRecursively(refeicoesTurmasSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const refeicoesTurmaMongooseSchema = RefeicaoTurma.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
refeicoesTurmasSchemas.RefeicoesTurmaListagem.example = await generateExample(refeicoesTurmasSchemas.RefeicoesTurmaListagem, null, refeicoesTurmaMongooseSchema);
refeicoesTurmasSchemas.RefeicoesTurmaDetalhes.example = await generateExample(refeicoesTurmasSchemas.RefeicoesTurmaDetalhes, null, refeicoesTurmaMongooseSchema);
refeicoesTurmasSchemas.RefeicoesTurmaPost.example = await generateExample(refeicoesTurmasSchemas.RefeicoesTurmaPost, null, refeicoesTurmaMongooseSchema);
refeicoesTurmasSchemas.RefeicoesTurmaPutPatch.example = await generateExample(refeicoesTurmasSchemas.RefeicoesTurmaPutPatch, null, refeicoesTurmaMongooseSchema);

export default refeicoesTurmasSchemas;
