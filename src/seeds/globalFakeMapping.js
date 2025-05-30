import fakerbr   from 'faker-br';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const fakeMappings = {
    // Campos comuns a vários models
    common: {
      nome: () =>
        fakerbr.name.firstName() +
        " " +
        fakerbr.name.lastName() +
        " " +
        fakerbr.name.lastName(),
      email: () => fakerbr.internet.email(),
      senha: () => fakerbr.internet.password(),
      link_foto: () => fakerbr.internet.url() + "/" + uuid() + ".jpg",
      ativo: () => fakerbr.random.boolean(),
      descricao: () => fakerbr.lorem.sentence(),
      localidade: () => fakerbr.address.city() + " - " + fakerbr.address.state(),
      rota: () => fakerbr.lorem.word(10),
      dominio: () => fakerbr.internet.url(),
    },
  
    // Mapping específico para o model Usuario
    Usuario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () =>
            fakerbr.name.firstName() +
            " " +
            fakerbr.name.lastName() +
            " " +
            fakerbr.name.lastName(),
        cpf: () => fakerbr.br.cpf(),
        email: () => fakerbr.internet.email(),
        senha: () => fakerbr.internet.password(),
        cargo: () => fakerbr.lorem.word(10),
        status: () => fakerbr.random.boolean(),
    },
  
    // Mapping específico para o model Sala
    Sala: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakerbr.lorem.word(10),
        bloco: () => fakerbr.random.number({ min: 1, max: 10 }).toString(),
    },
  
    // Mapping específico para o model Levantamento
    Levantamento: {
        inventario: () => new mongoose.Types.ObjectId().toString(),
        bem: () => ({
            salaID: () => new mongoose.Types.ObjectId().toString(),
            nome: () => fakerbr.commerce.productName(),
            tombo: () => fakerbr.random.alphaNumeric(10),
            responsavel: () => fakerbr.name.findName(),
            ocioso: () => fakerbr.random.boolean(),
        }),
        sala: () => new mongoose.Types.ObjectId().toString(),
        usuario: () => new mongoose.Types.ObjectId().toString(),
        imagem: () => fakerbr.internet.url() + "/" + uuid() + ".jpg",
        estado: () => {
            const values = ["Em condições de uso", "Inservível", "Danificado"];
            return values[Math.floor(Math.random() * values.length)];
        },
    },
  
    // Mapping específico para o model Inventario
    Inventario: {
        campus: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakerbr.lorem.word(10),
        data: () => fakerbr.date.past(),
        status: () => fakerbr.random.boolean(),
    },
  
    // Mapping específico para o model Campus
    Campus: {
        nome: () => fakerbr.lorem.word(10),
        telefone: () => fakerbr.phone.phoneNumber(),
        cidade: () => fakerbr.address.city(),
        bairro: () => fakerbr.address.neighborhood(),
        rua: () => fakerbr.address.streetName(),
        numeroResidencia: () => fakerbr.address.streetAddress(),
    },
  
    // Mapping específico para o model Bem
    Bem: {
        sala: () => new mongoose.Types.ObjectId().toString(),
        nome: () => fakerbr.commerce.productName(),
        tombo: () => fakerbr.random.alphaNumeric(10),
        responsavel: () => fakerbr.name.findName(),
        descricao: () => fakerbr.lorem.sentence(),
        valor: () => fakerbr.commerce.price(),
        auditado: () => fakerbr.random.boolean(),
        ocioso: () => fakerbr.random.boolean(),

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
  