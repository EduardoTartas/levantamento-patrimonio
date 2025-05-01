import fakebr from 'faker-br';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const fakeMappings = {
    // Campos comuns a vários models
    common: {
      nome: () =>
        fakebr.name.firstName() +
        " " +
        fakebr.name.lastName() +
        " " +
        fakebr.name.lastName(),
      email: () => fakebr.internet.email(),
      senha: () => fakebr.internet.password(),
      link_foto: () => fakebr.internet.url() + "/" + uuid() + ".jpg",
      ativo: () => fakebr.random.boolean(),
      descricao: () => fakebr.lorem.sentence(),
      localidade: () => fakebr.address.city() + " - " + fakebr.address.state(),
      rota: () => fakebr.lorem.word(10),
      dominio: () => fakebr.internet.url(),
    },
  
    // Mapping específico para o model Usuario
    Usuario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () =>
            fakebr.name.firstName() +
            " " +
            fakebr.name.lastName() +
            " " +
            fakebr.name.lastName(),
        cpf: () => fakebr.br.cpf(),
        email: () => fakebr.internet.email(),
        senha: () => fakebr.internet.password(),
        cargo: () => fakebr.lorem.word(10),
        status: () => fakebr.random.boolean(),
    },
  
    // Mapping específico para o model Sala
    Sala: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakebr.lorem.word(10),
        bloco: () => fakebr.random.number({ min: 1, max: 10 }).toString(),
    },
  
    // Mapping específico para o model Levantamento
    Levantamento: {
        inventario: () => new mongoose.Types.ObjectId().toString(),
        bem: () => ({
            salaID: () => new mongoose.Types.ObjectId().toString(),
            nome: () => fakebr.commerce.productName(),
            tombo: () => fakebr.random.alphaNumeric(10),
            responsavel: () => fakebr.name.findName(),
            ocioso: () => fakebr.random.boolean(),
        }),
        sala: () => new mongoose.Types.ObjectId().toString(),
        usuario: () => new mongoose.Types.ObjectId().toString(),
        imagem: () => fakebr.internet.url() + "/" + uuid() + ".jpg",
        estado: () => {
            const values = ["Em condições de uso", "Inservível", "Danificado"];
            return values[Math.floor(Math.random() * values.length)];
        },
    },
  
    // Mapping específico para o model Inventario
    Inventario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakebr.lorem.word(10),
        data: () => fakebr.date.past(),
        status: () => fakebr.random.boolean(),
    },
  
    // Mapping específico para o model Campus
    Campus: {
        nome: () => fakebr.lorem.word(10),
        telefone: () => fakebr.phone.phoneNumber(),
        cidade: () => fakebr.address.city(),
        bairro: () => fakebr.address.neighborhood(),
        rua: () => fakebr.address.streetName(),
        numeroResidencia: () => fakebr.address.streetAddress(),
    },
  
    // Mapping específico para o model Bem
    Bem: {
        sala: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakebr.commerce.productName(),
        tombo: () => fakebr.random.alphaNumeric(10),
        responsavel: () => fakebr.name.findName(),
        descricao: () => fakebr.lorem.sentence(),
        valor: () => fakebr.commerce.price(),
        auditado: () => fakebr.random.boolean(),
        ocioso: () => fakebr.random.boolean(),

    },
  };
  
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
  
  /**
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
  
  /**
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
  
  /**
   * Executa a validação para os models fornecidos, utilizando o mapping específico de cada um.
   */
  async function validateAllMappings() {
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
  
  // Executa a validação antes de prosseguir com o seeding ou outras operações
  validateAllMappings()
    .then((valid) => {
      if (valid) {
        console.log('Podemos acessar globalFakeMapping com segurança.');
        // Prossegue com o seeding ou outras operações
      } else {
        throw new Error('globalFakeMapping não possui todos os mapeamentos necessários.');
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  
  export default getGlobalFakeMapping;
  