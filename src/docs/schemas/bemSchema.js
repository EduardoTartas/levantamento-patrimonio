import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import Bem from '../../models/Bem.js';
import Sala from '../../models/Sala.js';
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

mongooseSchemaJsonSchema(mongoose);

const bemJsonSchema = Bem.schema.jsonSchema();
const salaJsonSchema = Sala.schema.jsonSchema();
delete bemJsonSchema.properties.__v;

const bemSchemas = {
    BemFiltro: {
        type: "object",
        properties: {
            nome: bemJsonSchema.properties.nome,
            patrimonio: bemJsonSchema.properties.patrimonio,
            sala: {
                type: "string",
                description: "ID ou nome da sala para filtrar bens"
            }
        }
    },
    BemListagem: {
        ...deepCopy(bemJsonSchema),
        description: "Schema para listagem de bens",
        properties: {
            ...bemJsonSchema.properties,
            sala: {
                type: "object",
                properties: {
                    _id: salaJsonSchema.properties._id,
                    nome: salaJsonSchema.properties.nome
                }
            }
        }
    },
    BemDetalhes: {
        ...deepCopy(bemJsonSchema),
        description: "Schema para detalhes de um bem",
        properties: {
            ...bemJsonSchema.properties,
            sala: {
                type: "object",
                properties: {
                    _id: salaJsonSchema.properties._id,
                    nome: salaJsonSchema.properties.nome,
                    bloco: salaJsonSchema.properties.bloco
                }
            }
        }
    },
    BemPost: {
        ...deepCopy(bemJsonSchema),
        required: ["nome", "patrimonio", "sala"],
        description: "Schema para criação de bem"
    },
    BemPutPatch: {
        ...deepCopy(bemJsonSchema),
        required: [],
        description: "Schema para atualização de bem"
    }
};

(async () => {
    for (const [key, schema] of Object.entries(bemSchemas)) {
        if (schema.type === 'object') {
            const example = await generateExample(schema, key, Bem.schema);
            schema.example = example;
        }
    }
})();

export default bemSchemas;
