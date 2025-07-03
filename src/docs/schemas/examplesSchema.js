// schemas/examplesSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Example from '../../models/Example.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const exampleJsonSchema = Example.schema.jsonSchema();

// Remove campos que não queremos na base original
delete exampleJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const examplesSchemas = {
  ExampleFiltro: {
    type: "object",
    properties: {
      nome: exampleJsonSchema.properties.nome,
      decricao: exampleJsonSchema.properties.descricao,
      codigo: exampleJsonSchema.properties.codigo,      
    }
  },

  ExampleListagem: {
    ...deepCopy(exampleJsonSchema),
    description: "Schema para listagem de examples"
  },
  ExampleDetalhes: {
    ...deepCopy(exampleJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  ExamplePost: {
    ...deepCopy(exampleJsonSchema),
    required: ["nome", "email"],
    description: "Schema para criação de usuário"
  },
  ExamplePutPatch: {
    ...deepCopy(exampleJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  }

};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  ExampleListagem: ['descricao'],
  ExampleDetalhes: ['codigo'],
}

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (examplesSchemas[schemaKey]) {
    removeFieldsRecursively(examplesSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const exampleMongooseSchema = Example.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
examplesSchemas.ExampleListagem.example = await generateExample(examplesSchemas.ExampleListagem, null, exampleMongooseSchema);
examplesSchemas.ExampleDetalhes.example = await generateExample(examplesSchemas.ExampleDetalhes, null, exampleMongooseSchema);


export default examplesSchemas;