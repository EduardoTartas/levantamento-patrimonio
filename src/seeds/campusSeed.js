import fakerbr from "faker-br";
import Campus from "../models/Campus.js";

export default async function campusSeed() {
    // Deleta todos os campus existentes no banco de dados
    await Campus.deleteMany({});

    // Gera 10 campus
    for (let i = 0; i < 10; i++) {
        const campus = {
            nome: fakerbr.lorem.word(),
            telefone: fakerbr.phone.phoneNumber().toString(),
            cidade: fakerbr.address.city(),
            bairro: fakerbr.address.neighborhood(),
            rua: fakerbr.address.streetName().toString(),
            numeroResidencia: fakerbr.address.streetAddress().toString(),
            status: fakerbr.random.boolean(),
        };

        await Campus.create(campus);
    }

    console.log("Campus gerados com sucesso");
}

// await DbConnect.conectar();
// await campusSeed();
