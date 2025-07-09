// schemas/levantamentoSchema.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Levantamento from '../../models/Levantamento.js';

import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

mongooseSchemaJsonSchema(mongoose);

const levantamentoJsonSchema = Levantamento.schema.jsonSchema();

delete levantamentoJsonSchema.properties.__v;

const levantamentoSchemas = {
  LevantamentoFiltro: {
    type: "object",
    properties: {
      inventario: {
        type: "string",
        description: "Filtrar por ID do inventário"
      },
      bem: {
        type: "string",
        description: "Filtrar por nome do bem (busca parcial, case-insensitive)"
      },
      tombo: {
        type: "string",
        description: "Filtrar por tombo do bem"
      },
      responsavel: {
        type: "string",
        description: "Filtrar por nome do responsável (busca parcial, case-insensitive)"
      },
      estado: {
        type: "string",
        enum: ["Em condições de uso", "Inservível", "Danificado"],
        description: "Filtrar por estado do bem"
      },
      ocioso: {
        type: "string",
        enum: ["true", "false"],
        description: "Filtrar por status ocioso do bem"
      },
      usuario: {
        type: "string",
        description: "Filtrar por ID do usuário responsável pelo levantamento"
      },
      salaNova: {
        type: "string",
        description: "Filtrar por ID da nova sala"
      },
      page: {
        type: "integer",
        minimum: 1,
        default: 1,
        description: "Número da página para paginação"
      },
      limite: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 10,
        description: "Limite de itens por página"
      }
    },
    description: "Schema para filtro de levantamentos"
  },
  LevantamentoListagem: {
    ...deepCopy(levantamentoJsonSchema),
    description: "Schema para listagem de levantamentos"
  },
  LevantamentoDetalhes: {
    ...deepCopy(levantamentoJsonSchema),
    description: "Schema para detalhes de um levantamento"
  },
  LevantamentoPost: {
    type: "object",
    properties: {
      inventario: {
        type: "string",
        description: "ID do inventário"
      },
      bemId: {
        type: "string",
        description: "ID do bem"
      },
      estado: {
        type: "string",
        enum: ["Em condições de uso", "Inservível", "Danificado"],
        description: "Estado do bem"
      },
      salaNova: {
        type: "string",
        description: "ID da nova sala (opcional)"
      },
      ocioso: {
        type: "boolean",
        default: false,
        description: "Se o bem está ocioso"
      }
    },
    required: ["inventario", "bem", "estado"],
    description: "Schema para criação de levantamento"
  },
  LevantamentoPutPatch: {
    ...deepCopy(levantamentoJsonSchema),
    required: [],
    description: "Schema para atualização de levantamento"
  },
  FotoUpload: {
    type: "object",
    properties: {
      foto: {
        type: "string",
        format: "binary",
        description: "Arquivo de imagem para upload (formatos aceitos: JPEG, PNG, GIF)"
      }
    },
    required: ["foto"],
    description: "Schema para upload de foto"
  },
  FotoResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Foto adicionada com sucesso"
      },
      imageUrl: {
        type: "string",
        example: "https://api.exemplo.com/images/levantamento_123_foto1.jpg"
      }
    },
    description: "Schema de resposta para upload de foto"
  }
};

const removalMapping = {
  LevantamentoListagem: [],
  LevantamentoDetalhes: [],
  LevantamentoPost: ['createdAt', 'updatedAt', '__v', '_id'],
  LevantamentoPutPatch: ['createdAt', 'updatedAt', '__v', '_id']
}

Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (levantamentoSchemas[schemaKey]) {
    removeFieldsRecursively(levantamentoSchemas[schemaKey], fields);
  }
});

const levantamentoMongooseSchema = Levantamento.schema;

const addExamples = async () => {
  levantamentoSchemas.LevantamentoListagem.example = await generateExample(levantamentoSchemas.LevantamentoListagem, null, levantamentoMongooseSchema);
  levantamentoSchemas.LevantamentoDetalhes.example = await generateExample(levantamentoSchemas.LevantamentoDetalhes, null, levantamentoMongooseSchema);
  levantamentoSchemas.LevantamentoPost.example = await generateExample(levantamentoSchemas.LevantamentoPost, null, levantamentoMongooseSchema);
  levantamentoSchemas.LevantamentoPutPatch.example = await generateExample(levantamentoSchemas.LevantamentoPutPatch, null, levantamentoMongooseSchema);
};

addExamples().catch(console.error);

export default levantamentoSchemas;
