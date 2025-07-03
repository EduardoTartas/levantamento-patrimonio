// schemas/estudantesSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Estudante from '../../models/Estudante.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const estudanteJsonSchema = Estudante.schema.jsonSchema();

// Remove campos que não queremos na base original
delete estudanteJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const estudantesSchemas = {
  EstudanteFiltro: {
    type: "object",
    properties: {
      matricula: estudanteJsonSchema.properties.matricula,
      nome: estudanteJsonSchema.properties.nome,
      ativo: estudanteJsonSchema.properties.ativo,
      turma: estudanteJsonSchema.properties.turma,
    }
  },
  EstudanteListagem: {
    ...deepCopy(estudanteJsonSchema),
    description: "Schema para listagem de usuários"
  },
  EstudanteDetalhes: {
    ...deepCopy(estudanteJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  EstudantePost: {
    ...deepCopy(estudanteJsonSchema),
    description: "Schema para criação de usuário"
  },
  EstudantePutPatch: {
    ...deepCopy(estudanteJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  EstudanteListagem: ['__v'],
  EstudanteDetalhes: ['__v'],
  EstudantePost: ['createdAt', 'updatedAt', '__v', '_id'],
  EstudantePutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (estudantesSchemas[schemaKey]) {
    removeFieldsRecursively(estudantesSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const estudanteMongooseSchema = Estudante.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
estudantesSchemas.EstudanteListagem.example = await generateExample(estudantesSchemas.EstudanteListagem, null, estudanteMongooseSchema);
estudantesSchemas.EstudanteDetalhes.example = await generateExample(estudantesSchemas.EstudanteDetalhes, null, estudanteMongooseSchema);
estudantesSchemas.EstudantePost.example = await generateExample(estudantesSchemas.EstudantePost, null, estudanteMongooseSchema);
estudantesSchemas.EstudantePutPatch.example = await generateExample(estudantesSchemas.EstudantePutPatch, null, estudanteMongooseSchema);

export default estudantesSchemas;
