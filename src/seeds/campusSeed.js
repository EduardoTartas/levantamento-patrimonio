import { faker } from "@faker-js/faker";
import Campus from "../models/Campus.js";

export default async function campusSeed() {
    // Deleta todos os campus existentes no banco de dados
    await Campus.deleteMany({});

    // Gera 10 campus
    for (let i = 0; i < 10; i++) {
        const campus = {
            nome: faker.company.name(),
            telefone: faker.phone.number(),
            cidade: faker.location.city(),
            bairro: faker.location.secondaryAddress(),
            rua: faker.location.street(),
            numeroResidencia: faker.location.streetAddress(),
            status: faker.datatype.boolean(),
        };

        await Campus.create(campus);
    }

    console.log("Campus gerados com sucesso");
}

// await DbConnect.conectar();
// await campusSeed();
