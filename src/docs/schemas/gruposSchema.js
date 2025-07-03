import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Grupo from '../../models/Grupo.js';
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir do schema do modelo Grupo
const grupoJsonSchema = Grupo.schema.jsonSchema();

// Remove o campo __v da representação original, se existir
delete grupoJsonSchema.properties.__v;

// Compondo os diferentes contratos da API utilizando cópias profundas do schema gerado
const gruposSchemas = {
  GrupoFiltro: {
    type: "object",
    properties: {
      nome: grupoJsonSchema.properties.nome,
      descricao: grupoJsonSchema.properties.descricao,
      ativo: grupoJsonSchema.properties.ativo,
      unidades: grupoJsonSchema.properties.nome,
    }
  },
  GrupoListagem: {
    ...deepCopy(grupoJsonSchema),
    required: [],
    description: "Schema para listagem de grupos"
  },
  GrupoDetalhes: {
    ...deepCopy(grupoJsonSchema),
    required: [],
    description: "Schema para detalhes de um grupo"
  },
  GrupoPost: {
    ...deepCopy(grupoJsonSchema),
    required: ["nome", "descricao"],
    description: "Schema para criação de grupo"
  },
  GrupoPostResposta: {
    ...deepCopy(grupoJsonSchema),
    required: [],
    description: "Schema de resposta para criação de grupo"
  },
  GrupoPutPatch: {
    ...deepCopy(grupoJsonSchema),
    required: [],
    description: "Schema para atualização de grupo"
  },
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  GrupoListagem: ['createdAt', 'updatedAt', '__v'],
  GrupoDetalhes: ['createdAt', 'updatedAt', '__v'],
  GrupoPost: ['createdAt', 'updatedAt', '__v', '_id'],
  GrupoPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
  GrupoPostResposta: ['createdAt', 'updatedAt', '__v'],
};

// Aplica a remoção de campos conforme o mapping definido
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (gruposSchemas[schemaKey]) {
    removeFieldsRecursively(gruposSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detecção automática de referências
const grupoMongooseSchema = Grupo.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose
gruposSchemas.GrupoListagem.example = await generateExample(gruposSchemas.GrupoListagem, null, grupoMongooseSchema);
gruposSchemas.GrupoDetalhes.example = await generateExample(gruposSchemas.GrupoDetalhes, null, grupoMongooseSchema);
gruposSchemas.GrupoPost.example = await generateExample(gruposSchemas.GrupoPost, null, grupoMongooseSchema);
gruposSchemas.GrupoPutPatch.example = await generateExample(gruposSchemas.GrupoPutPatch, null, grupoMongooseSchema);
gruposSchemas.GrupoPostResposta.example = await generateExample(gruposSchemas.GrupoPostResposta, null, grupoMongooseSchema);

export default gruposSchemas;
