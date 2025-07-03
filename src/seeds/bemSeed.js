import { faker } from "@faker-js/faker";
import Bem from '../models/Bem.js';
import Sala from '../models/Sala.js';

export default async function bemSeed() {

    // Coleta as salas cadastradas no banco de dados
    const salaList = await Sala.find({});

    if (salaList.length === 0) {
        console.log("Nenhuma sala encontrada. Execute salaSeed primeiro.");
        return;
    }

    // Deleta todos os bens existentes no banco de dados
    await Bem.deleteMany({});

    // Gera 1500 bens com base nas salas disponíveis
    for (let i = 0; i < 1500; i++) {
        const randomSala = salaList[Math.floor(Math.random() * salaList.length)];
        
        const bem = {
            sala: randomSala._id,
            nome: faker.commerce.productName(),
            tombo: faker.number.int({ min: 100000, max: 999999 }).toString(),
            responsavel: {
                nome: faker.person.fullName(),
                cpf: faker.string.numeric(11), // CPF fictício
            },
            descricao: faker.lorem.sentence(),
            valor: parseFloat(faker.commerce.price()),
            auditado: faker.datatype.boolean(),
        };

        await Bem.create(bem);
    }

    console.log("Seeds dos bens implementados com sucesso.");
}

//await DbConnect.conectar();
//await seedBens();