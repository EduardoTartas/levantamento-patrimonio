import { faker } from "@faker-js/faker";
import Sala from '../models/Sala.js';
import Campus from '../models/Campus.js';

export default async function salaSeed() {
     
    // Busca todos os campus existentes
    const campusList = await Campus.find({});

    if (campusList.length === 0) {
        console.log("Nenhum campus encontrado. Execute campusSeed primeiro.");
        return;
    }

    // Deleta todas as salas existentes no banco de dados
    await Sala.deleteMany({});

    // Gera 100 salas
    for(let i = 0; i < 100; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const sala = {
            campus: randomCampus._id,
            nome: `Sala ${faker.number.int({ min: 100, max: 999 })}`,
            bloco: `Bloco ${faker.string.alpha({ length: 1, casing: 'upper' })}`,
        };

        await Sala.create(sala);
    }

    console.log("Salas implementadas com sucesso.");
}

//await DbConnect.conectar();
//await salaSeed();