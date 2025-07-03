import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Unidade from '../../models/Unidade.js';
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir do schema do modelo Unidade
const unidadeJsonSchema = Unidade.schema.jsonSchema();

// Remove o campo __v da representação original, se existir
delete unidadeJsonSchema.properties.__v;

// Compondo os diferentes contratos da API utilizando cópias profundas do schema gerado
const unidadesSchemas = {
    UnidadeFiltro: {
        type: "object",
        properties: {
            nome: unidadeJsonSchema.properties.nome,
            localidade: unidadeJsonSchema.properties.localidade,
            ativo: unidadeJsonSchema.properties.ativo,
        }
    },
    UnidadeListagem: {
        ...deepCopy(unidadeJsonSchema),
        required: [],
        description: "Schema para listagem de unidades"
    },
    UnidadeDetalhes: {
        ...deepCopy(unidadeJsonSchema),
        required: [],
        description: "Schema para detalhes de uma unidade"
    },
    UnidadePost: {
        ...deepCopy(unidadeJsonSchema),
        required: ["nome", "localidade"],
        description: "Schema para criação de unidade"
    },
    UnidadePostResposta: {
        ...deepCopy(unidadeJsonSchema),
        required: [],
        description: "Schema de resposta para criação de unidade"
    },
    UnidadePutPatch: {
        ...deepCopy(unidadeJsonSchema),
        required: [],
        description: "Schema para atualização de unidade"
    },
};

// Define, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
    UnidadeListagem: ['createdAt', 'updatedAt', '__v'],
    UnidadeDetalhes: ['createdAt', 'updatedAt', '__v'],
    UnidadePost: ['createdAt', 'updatedAt', '__v', '_id'],
    UnidadePutPatch: ['createdAt', 'updatedAt', '__v', '_id'],
    UnidadePostResposta: ['createdAt', 'updatedAt', '__v'],
};

// Aplica a remoção de campos conforme o mapping definido
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
    if (unidadesSchemas[schemaKey]) {
        removeFieldsRecursively(unidadesSchemas[schemaKey], fields);
    }
});

// Utiliza o schema do Mongoose para detecção automática de referências
const unidadeMongooseSchema = Unidade.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose
unidadesSchemas.UnidadeListagem.example = await generateExample(unidadesSchemas.UnidadeListagem, null, unidadeMongooseSchema);
unidadesSchemas.UnidadeDetalhes.example = await generateExample(unidadesSchemas.UnidadeDetalhes, null, unidadeMongooseSchema);
unidadesSchemas.UnidadePost.example = await generateExample(unidadesSchemas.UnidadePost, null, unidadeMongooseSchema);
unidadesSchemas.UnidadePutPatch.example = await generateExample(unidadesSchemas.UnidadePutPatch, null, unidadeMongooseSchema);
unidadesSchemas.UnidadePostResposta.example = await generateExample(unidadesSchemas.UnidadePostResposta, null, unidadeMongooseSchema);

export default unidadesSchemas;
