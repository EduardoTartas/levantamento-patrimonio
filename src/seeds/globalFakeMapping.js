import { faker } from "@faker-js/faker";
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

// Importa todos os modelos
import Usuario from '../models/Usuario.js';
import Campus from '../models/Campus.js';
import Sala from '../models/Sala.js';
import Inventario from '../models/Inventario.js';
import Bem from '../models/Bem.js';
import Levantamento from '../models/Levantamento.js';
import PassResetToken from '../models/PassResetToken.js';
import RefreshToken from '../models/RefreshToken.js';
import Rota from '../models/Rota.js';

const fakeMappings = {
    // Campos comuns a vários models
    common: {
      nome: () =>
        faker.person.firstName() +
        " " +
        faker.person.lastName() +
        " " +
        faker.person.lastName(),
      email: () => faker.internet.email(),
      senha: () => faker.internet.password(),
      link_foto: () => faker.internet.url() + "/" + uuid() + ".jpg",
      ativo: () => faker.datatype.boolean(),
      descricao: () => faker.lorem.sentence(),
      localidade: () => faker.location.city() + " - " + faker.location.state(),
      rota: () => faker.lorem.word(),
      dominio: () => faker.internet.url(),
    },
  
    // Mapping específico para o model Usuario
    Usuario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () =>
            faker.person.firstName() +
            " " +
            faker.person.lastName() +
            " " +
            faker.person.lastName(),
        cpf: () => faker.string.numeric(11),
        email: () => faker.internet.email(),
        senha: () => faker.internet.password(),
        senhaToken: () => faker.internet.password(),
        senhaTokenExpira: () => faker.date.future(),
        cargo: () => faker.lorem.word(),
        status: () => faker.datatype.boolean(),
    },
  
    // Mapping específico para o model Sala
    Sala: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => `Sala ${faker.number.int({ min: 100, max: 999 })}`,
        bloco: () => `Bloco ${faker.string.alpha({ length: 1, casing: 'upper' })}`,
    },
  
    // Mapping específico para o model Levantamento
    Levantamento: {
        inventario: () => new mongoose.Types.ObjectId().toString(),
        bem: () => ({
            id: () => new mongoose.Types.ObjectId().toString(),
            salaId: () => new mongoose.Types.ObjectId().toString(),
            nome: () => faker.commerce.productName(),
            tombo: () => faker.string.alphanumeric(10),
            responsavel: () => ({
                nome: () => faker.person.fullName(),
                cpf: () => faker.string.numeric(11),
            }),
            descricao: () => faker.lorem.sentence(),
        }),
        salaNova: () => new mongoose.Types.ObjectId().toString(),
        usuario: () => new mongoose.Types.ObjectId().toString(),
        imagem: () => [faker.internet.url() + "/" + uuid() + ".jpg"],
        estado: () => {
            const values = ["Em condições de uso", "Inservível", "Danificado"];
            return values[Math.floor(Math.random() * values.length)];
        },
        ocioso: () => faker.datatype.boolean(),
    },
  
    // Mapping específico para o model Inventario
    Inventario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => `Inventário ${faker.lorem.words(2)}`,
        data: () => faker.date.past(),
        status: () => faker.datatype.boolean(),
    },
  
    // Mapping específico para o model Campus
    Campus: {
        nome: () => faker.company.name(),
        telefone: () => faker.phone.number(),
        cidade: () => faker.location.city(),
        bairro: () => faker.location.secondaryAddress(),
        rua: () => faker.location.street(),
        numeroResidencia: () => faker.location.streetAddress(),
        status: () => faker.datatype.boolean(),
    },
  
    // Mapping específico para o model Bem
    Bem: {
        sala: () => new mongoose.Types.ObjectId().toString(),
        nome: () => faker.commerce.productName(),
        tombo: () => faker.string.alphanumeric(10),
        responsavel: () => ({
            nome: () => faker.person.fullName(),
            cpf: () => faker.string.numeric(11),
        }),
        descricao: () => faker.lorem.sentence(),
        valor: () => parseFloat(faker.commerce.price()),
        auditado: () => faker.datatype.boolean(),
    },

    // Mapping específico para o model PassResetToken
    PassResetToken: {
        usuario: () => new mongoose.Types.ObjectId().toString(),
        token: () => faker.string.alphanumeric(32),
        expiresAt: () => faker.date.future(),
        used: () => faker.datatype.boolean(),
    },

    // Mapping específico para o model RefreshToken
    RefreshToken: {
        token: () => faker.string.alphanumeric(64),
        user: () => new mongoose.Types.ObjectId().toString(),
        createdAt: () => faker.date.recent(),
    },

    // Mapping específico para o model Rota
    Rota: {
        rota: () => faker.lorem.word(),
        dominio: () => faker.internet.url(),
        ativo: () => faker.datatype.boolean(),
        buscar: () => faker.datatype.boolean(),
        enviar: () => faker.datatype.boolean(),
        substituir: () => faker.datatype.boolean(),
        modificar: () => faker.datatype.boolean(),
        excluir: () => faker.datatype.boolean(),
    },
  };
  
/*
 * Carrega todos os modelos disponíveis
 */
async function loadModels() {
  return [
    { model: Usuario, name: 'Usuario' },
    { model: Campus, name: 'Campus' },
    { model: Sala, name: 'Sala' },
    { model: Inventario, name: 'Inventario' },
    { model: Bem, name: 'Bem' },
    { model: Levantamento, name: 'Levantamento' },
    { model: PassResetToken, name: 'PassResetToken' },
    { model: RefreshToken, name: 'RefreshToken' },
    { model: Rota, name: 'Rota' },
  ];
}

export async function getGlobalFakeMapping() {
    const models = await loadModels();
    let globalMapping = { ...fakeMappings.common };
  
    models.forEach(({ name }) => {
      if (fakeMappings[name]) {
        globalMapping = {
          ...globalMapping,
          ...fakeMappings[name],
        };
      }
    });
  
    return globalMapping;
  }
  
  /*
   * Função auxiliar para extrair os nomes dos campos de um schema,
   * considerando apenas os níveis superiores (campos aninhados são verificados pela parte antes do ponto).
   */
  function getSchemaFieldNames(schema) {
    const fieldNames = new Set();
    Object.keys(schema.paths).forEach((key) => {
      if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return;
      const topLevel = key.split('.')[0];
      fieldNames.add(topLevel);
    });
    return Array.from(fieldNames);
  }
  
  /*
   * Valida se o mapping fornecido cobre todos os campos do model.
   * Retorna um array com os nomes dos campos que estiverem faltando.
   */
  function validateModelMapping(model, modelName, mapping) {
    const fields = getSchemaFieldNames(model.schema);
    const missing = fields.filter((field) => !(field in mapping));
    if (missing.length > 0) {
      console.error(
        `Model ${modelName} está faltando mapeamento para os campos: ${missing.join(', ')}`
      );
    } else {
      console.log(`Model ${modelName} possui mapeamento para todos os campos.`);
    }
    return missing;
  }
  
  /*
   * Executa a validação para os models fornecidos, utilizando o mapping específico de cada um.
   */
  export async function validateAllMappings() {
    const models = await loadModels();
    let totalMissing = {};
  
    models.forEach(({ model, name }) => {
      // Combina os campos comuns com os específicos de cada model
      const mapping = {
        ...fakeMappings.common,
        ...(fakeMappings[name] || {}),
      };
      const missing = validateModelMapping(model, name, mapping);
      if (missing.length > 0) {
        totalMissing[name] = missing;
      }
    });
  
    if (Object.keys(totalMissing).length === 0) {
      console.log('globalFakeMapping cobre todos os campos de todos os models.');
      return true;
    } else {
      console.warn('Faltam mapeamentos para os seguintes models:', totalMissing);
      return false;
    }
  }

  export default getGlobalFakeMapping;
  