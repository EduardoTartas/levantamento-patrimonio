// schemas/turmasSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Turma from '../../models/Turma.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const turmaJsonSchema = Turma.schema.jsonSchema();

// Remove campos que não queremos na base original
delete turmaJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const turmasSchemas = {
  TurmaFiltro: {
    type: "object",
    properties: {
      codigo_suap: turmaJsonSchema.properties.codigo_suap,
      descricao: turmaJsonSchema.properties.descricao,
      curso: turmaJsonSchema.properties.curso,
    }
  },
  TurmaListagem: {
    ...deepCopy(turmaJsonSchema),
    description: "Schema para listagem de usuários"
  },
  TurmaDetalhes: {
    ...deepCopy(turmaJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  TurmaPost: {
    ...deepCopy(turmaJsonSchema),
    description: "Schema para criação de usuário"
  },
  TurmaPutPatch: {
    ...deepCopy(turmaJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  TurmaListagem: ['__v'],
  TurmaDetalhes: ['__v'],
  TurmaPost: ['createdAt', 'updatedAt', '__v', '_id'],
  TurmaPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (turmasSchemas[schemaKey]) {
    removeFieldsRecursively(turmasSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const turmaMongooseSchema = Turma.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
turmasSchemas.TurmaListagem.example = await generateExample(turmasSchemas.TurmaListagem, null, turmaMongooseSchema);
turmasSchemas.TurmaDetalhes.example = await generateExample(turmasSchemas.TurmaDetalhes, null, turmaMongooseSchema);
turmasSchemas.TurmaPost.example = await generateExample(turmasSchemas.TurmaPost, null, turmaMongooseSchema);
turmasSchemas.TurmaPutPatch.example = await generateExample(turmasSchemas.TurmaPutPatch, null, turmaMongooseSchema);

export default turmasSchemas;
