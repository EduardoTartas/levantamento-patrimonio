import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import Campus from '../models/Campus.js';
import Usuario from '../models/Usuario.js';

export default async function usuarioSeed() {
     
    // Coleta os campus cadastrados no banco de dados
    const campusList = await Campus.find({});

    if (campusList.length === 0) {
        console.log("Nenhum campus encontrado. Execute campusSeed primeiro.");
        return;
    }

    await Usuario.deleteMany({});

    const senhaAdmin = await bcrypt.hash("admin", 10);
    const primeiroCampus = campusList[0];
    
    const adminUser = {
        campus: primeiroCampus._id.toString(),
        nome: "admin",
        cpf: "00000000000",
        email: "admin@admin.com",
        senha: senhaAdmin,
        cargo: "Funcionario Cpalm",
        status: true
    };

    await Usuario.create(adminUser);
    console.log("Usuário admin criado com sucesso.");

    // Gera 50 usuários
    for(let i = 0; i < 50; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];
        
        const usuario = {
            campus: randomCampus._id.toString(),
            nome: `${faker.person.firstName()} ${faker.person.lastName()}`,
            cpf: faker.string.numeric(11), // Gera CPF fictício
            email: faker.internet.email(),
            senha: faker.internet.password(8),
            cargo: faker.helpers.arrayElement(["Comissionado", "Funcionario Cpalm"]),
            status: faker.datatype.boolean()
        };

        await Usuario.create(usuario);
    }

    console.log("Usuários implementados com sucesso.");
}