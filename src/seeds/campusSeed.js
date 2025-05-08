import fakerbr from "faker-br";
import Campus  from "../models/Campus.js";
// import DbConnect from "../config/dbConnect.js";

export default async function campusSeed() {
    // Deleta todos os campus existentes no banco de dados
    await Campus.deleteMany({});

    // Gera 25 campus
    for (let i = 0; i < 10; i++) {
        const campus = {
            nome: fakerbr.lorem.word(10),
            telefone: fakerbr.phone.phoneNumber().toString(),
            cidade: fakerbr.address.city(),
            bairro: fakerbr.lorem.word(15),
            rua: fakerbr.address.streetName().toString(),
            numeroResidencia: fakerbr.address.streetAddress().toString(),
        };

        await Campus.create(campus);
    }

    console.log("Campus gerados com sucesso");
}

//await DbConnect.conectar();
// await campusSeed();
