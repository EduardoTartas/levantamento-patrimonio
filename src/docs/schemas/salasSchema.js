// schemas/salasSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import Sala from '../../models/Sala.js';
import Campus from '../../models/Campus.js';

// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const salaJsonSchema = Sala.schema.jsonSchema();
const campusJsonSchema = Campus.schema.jsonSchema();

// Remove campos que não queremos na base original
delete salaJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const salasSchemas = {
    SalaFiltro: {
        type: "object",
        properties: {
            nome: salaJsonSchema.properties.nome,
            bloco: salaJsonSchema.properties.bloco,
            campus: {
                type: "string",
                description: "ID ou nome do campus para filtrar salas"
            }
        }
    },
    SalaListagem: {
        ...deepCopy(salaJsonSchema),
        description: "Schema para listagem de salas",
        properties: {
            ...salaJsonSchema.properties,
            campus: {
                type: "object",
                properties: {
                    _id: campusJsonSchema.properties._id,
                    nome: campusJsonSchema.properties.nome
                }
            }
        }
    },
    SalaDetalhes: {
        ...deepCopy(salaJsonSchema),
        description: "Schema para detalhes de uma sala",
        properties: {
            ...salaJsonSchema.properties,
            campus: {
                type: "object",
                properties: {
                    _id: campusJsonSchema.properties._id,
                    nome: campusJsonSchema.properties.nome,
                    endereco: campusJsonSchema.properties.endereco,
                    telefone: campusJsonSchema.properties.telefone
                }
            }
        }
    },
    SalaPost: {
        ...deepCopy(salaJsonSchema),
        required: ["nome", "bloco", "campus"],
        description: "Schema para criação de sala"
    },
    SalaPutPatch: {
        ...deepCopy(salaJsonSchema),
        required: [],
        description: "Schema para atualização de sala"
    }
};

// Gera exemplos para cada schema
(async () => {
    for (const [key, schema] of Object.entries(salasSchemas)) {
        if (schema.type === 'object') {
            const example = await generateExample(schema, key, Sala.schema);
            schema.example = example;
        }
    }
})();

export default salasSchemas;
