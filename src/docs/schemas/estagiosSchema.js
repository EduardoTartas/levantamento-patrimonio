// schemas/estagiosSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Estagio from '../../models/Estagio.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const estagioJsonSchema = Estagio.schema.jsonSchema();

// Remove campos que não queremos na base original
delete estagioJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const estagiosSchemas = {
  EstagioFiltro: {
    type: "object",
    properties: {
      estudante: estagioJsonSchema.properties.estudante,
      data_inicio: estagioJsonSchema.properties.data_inicio,
      data_termino: estagioJsonSchema.properties.data_termino,
      descricao: estagioJsonSchema.properties.descricao,
      status: estagioJsonSchema.properties.status
    }
  },
  EstagioListagem: {
    ...deepCopy(estagioJsonSchema),
    description: "Schema para listagem de usuários"
  },
  EstagioDetalhes: {
    ...deepCopy(estagioJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  EstagioPost: {
    ...deepCopy(estagioJsonSchema),
    description: "Schema para criação de usuário"
  },
  EstagioPutPatch: {
    ...deepCopy(estagioJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  EstagioListagem: ['__v'],
  EstagioDetalhes: ['__v'],
  EstagioPost: ['createdAt', 'updatedAt', '__v', '_id'],
  EstagioPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (estagiosSchemas[schemaKey]) {
    removeFieldsRecursively(estagiosSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const estagioMongooseSchema = Estagio.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
estagiosSchemas.EstagioListagem.example = await generateExample(estagiosSchemas.EstagioListagem, null, estagioMongooseSchema);
estagiosSchemas.EstagioDetalhes.example = await generateExample(estagiosSchemas.EstagioDetalhes, null, estagioMongooseSchema);
estagiosSchemas.EstagioPost.example = await generateExample(estagiosSchemas.EstagioPost, null, estagioMongooseSchema);
estagiosSchemas.EstagioPutPatch.example = await generateExample(estagiosSchemas.EstagioPutPatch, null, estagioMongooseSchema);

export default estagiosSchemas;
