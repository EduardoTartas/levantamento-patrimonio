// schemas/cursosSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Curso from '../../models/Curso.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const cursoJsonSchema = Curso.schema.jsonSchema();

// Remove campos que não queremos na base original
delete cursoJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const cursosSchemas = {
  CursoFiltro: {
    type: "object",
    properties: {
      codigo: cursoJsonSchema.properties.codigo,
      nome: cursoJsonSchema.properties.nome,
    }
  },
  CursoListagem: {
    ...deepCopy(cursoJsonSchema),
    description: "Schema para listagem de usuários"
  },
  CursoDetalhes: {
    ...deepCopy(cursoJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  CursoPost: {
    ...deepCopy(cursoJsonSchema),
    description: "Schema para criação de usuário"
  },
  CursoPutPatch: {
    ...deepCopy(cursoJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }
};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  CursoListagem: ['__v'],
  CursoDetalhes: ['__v'],
  CursoPost: ['createdAt', 'updatedAt', '__v', '_id'],
  CursoPutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (cursosSchemas[schemaKey]) {
    removeFieldsRecursively(cursosSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const cursoMongooseSchema = Curso.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
cursosSchemas.CursoListagem.example = await generateExample(cursosSchemas.CursoListagem, null, cursoMongooseSchema);
cursosSchemas.CursoDetalhes.example = await generateExample(cursosSchemas.CursoDetalhes, null, cursoMongooseSchema);
cursosSchemas.CursoPost.example = await generateExample(cursosSchemas.CursoPost, null, cursoMongooseSchema);
cursosSchemas.CursoPutPatch.example = await generateExample(cursosSchemas.CursoPutPatch, null, cursoMongooseSchema);

export default cursosSchemas;
