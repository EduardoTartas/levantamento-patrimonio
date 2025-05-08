import fakerbr from "faker-br";
import Campus from "../models/Campus.js";
import DbConnect from "../config/dbConnect.js";

export default async function campusSeed() {
  for (let i = 0; i < 10; i++) {
    const campus = {
      nome: fakerbr.lorem.word(10),
      telefone: fakerbr.phone.phoneNumber().ToString(),
      cidade: fakerbr.address.city(),
      bairro: fakerbr.address.neighborhood(),
      rua: fakerbr.address.streetName(),
      numeroResidencia: fakerbr.address.streetAddress().ToString(),
    };
    await Campus.create(campus);
  }
  console.log("Campus seed completed");
}


DbConnect.conectar();
console.log("Conectado ao banco de dados");
campusSeed();
console.log("Seed executado com sucesso");