// schemas/suppliersSchemas.js
import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Supplier from '../../models/Supplier.js';
import Grupo from '../../models/Grupo.js';
import Unidade from '../../models/Unidade.js';


// Importa as funções utilitárias separadas
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Registra o plugin para que o Mongoose ganhe o método jsonSchema()
mongooseSchemaJsonSchema(mongoose);

// Gera o JSON Schema a partir dos schemas dos modelos
const supplierJsonSchema = Supplier.schema.jsonSchema();

// Remove campos que não queremos na base original
delete supplierJsonSchema.properties.__v;

// Componha os diferentes contratos da sua API utilizando cópias profundas dos schemas
const suppliersSchemas = {
  SupplierFiltro: {
    type: "object",
    properties: {
      nome: supplierJsonSchema.properties.nome,
      email: supplierJsonSchema.properties.email,
      ativo: supplierJsonSchema.properties.ativo,
      cnpj: supplierJsonSchema.properties.cnpj,
      telefone: supplierJsonSchema.properties.telefone,
    }
  },
  SupplierListagem: {
    ...deepCopy(supplierJsonSchema),
    description: "Schema para listagem de usuários"
  },
  SupplierDetalhes: {
    ...deepCopy(supplierJsonSchema),
    description: "Schema para detalhes de um usuário"
  },
  SupplierPost: {
    ...deepCopy(supplierJsonSchema),
    description: "Schema para criação de usuário"
  },
  SupplierPutPatch: {
    ...deepCopy(supplierJsonSchema),
    required: [],
    description: "Schema para atualização de usuário"
  },

};

// Mapeamento para definir, de forma individual, quais campos serão removidos de cada schema
const removalMapping = {
  SupplierListagem: ['accesstoken', 'refreshtoken', 'tokenUnico', 'senha'],
  SupplierDetalhes: ['accesstoken', 'tokenUnico', 'refreshtoken', 'senha'],
  SupplierPost: ['accesstoken', 'refreshtoken', 'tokenUnico', 'createdAt', 'updatedAt', '__v', '_id', 'senha'],
  SupplierPutPatch: ['accesstoken', 'refreshtoken', 'tokenUnico', 'senha', 'email', 'createdAt', 'updatedAt', '__v', '_id'],
  SupplierLogin: ['tokenUnico', 'senha', '__v', '_id'],
  SupplierRespostaLogin: ['tokenUnico', 'senha', 'createdAt', 'updatedAt', '__v'],
};

// Aplica a remoção de campos de forma individual a cada schema
Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (suppliersSchemas[schemaKey]) {
    removeFieldsRecursively(suppliersSchemas[schemaKey], fields);
  }
});

// Utiliza o schema do Mongoose para detectar referências automaticamente
const supplierMongooseSchema = Supplier.schema;

// Gera os exemplos automaticamente para cada schema, passando o schema do Mongoose para detecção de referências
suppliersSchemas.SupplierListagem.example = await generateExample(suppliersSchemas.SupplierListagem, null, supplierMongooseSchema);
suppliersSchemas.SupplierDetalhes.example = await generateExample(suppliersSchemas.SupplierDetalhes, null, supplierMongooseSchema);
suppliersSchemas.SupplierPost.example = await generateExample(suppliersSchemas.SupplierPost, null, supplierMongooseSchema);
suppliersSchemas.SupplierPutPatch.example = await generateExample(suppliersSchemas.SupplierPutPatch, null, supplierMongooseSchema);

export default suppliersSchemas;