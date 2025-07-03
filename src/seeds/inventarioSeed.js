import { faker } from "@faker-js/faker";
import Inventario from '../models/Inventario.js';
import Campus from '../models/Campus.js';

export default async function inventarioSeed() {
    // Coleta os campus cadastrados no banco de dados
    const campusList = await Campus.find({});

    if (campusList.length === 0) {
        console.log("Nenhum campus encontrado. Execute campusSeed primeiro.");
        return;
    }

    // Deleta todos os inventários existentes no banco de dados
    await Inventario.deleteMany({});

    // Gera 20 inventários
    for (let i = 0; i < 20; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const inventario = {
            campus: randomCampus._id,
            nome: `Inventário ${faker.lorem.words(2)}`,
            data: faker.date.past(),
            status: faker.datatype.boolean(),
        };

        await Inventario.create(inventario);
    }

    console.log("Inventários gerados com sucesso");
}

//DbConnect.conectar();
//inventarioSeed();