// schemas/projetosSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Projeto from '../../models/Projeto.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';
import estudantesRoutes from '../paths/estudantes.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const projetoJsonSchema = Projeto.schema.jsonSchema();

// Remove campos que não queremos na base original
delete projetoJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const projetosSchemas = {
  ProjetoFiltro: {
    type: "object",
    properties: {
      nome: projetoJsonSchema.properties.nome,
      data_inicio: projetoJsonSchema.properties.data_inicio,
      data_termino: projetoJsonSchema.properties.data_termino,
      status: projetoJsonSchema.properties.status,
      estudante: projetoJsonSchema.properties.estudantes,
    }
  },
  ProjetoListagem: {
    ...deepCopy(projetoJsonSchema),
    description: "Schema para listagem de usuários"
  },
  ProjetoDetalhes: {
    ...deepCopy(projetoJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  ProjetoPost: {
    ...deepCopy(projetoJsonSchema),
    description: "Schema para criação de usuário"
  },
  ProjetoPutPatch: {
    ...deepCopy(projetoJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  ProjetoListagem: ['__v'],
  ProjetoDetalhes: ['__v'],
  ProjetoPost: ['createdAt', 'updatedAt', '__v', '_id'],
  ProjetoPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (projetosSchemas[schemaKey]) {
    removeFieldsRecursively(projetosSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const projetoMongooseSchema = Projeto.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
projetosSchemas.ProjetoListagem.example = await generateExample(projetosSchemas.ProjetoListagem, null, projetoMongooseSchema);
projetosSchemas.ProjetoDetalhes.example = await generateExample(projetosSchemas.ProjetoDetalhes, null, projetoMongooseSchema);
projetosSchemas.ProjetoPost.example = await generateExample(projetosSchemas.ProjetoPost, null, projetoMongooseSchema);
projetosSchemas.ProjetoPutPatch.example = await generateExample(projetosSchemas.ProjetoPutPatch, null, projetoMongooseSchema);

export default projetosSchemas;
