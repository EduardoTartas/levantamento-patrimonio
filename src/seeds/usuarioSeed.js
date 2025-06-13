import fakerbr from 'faker-br';
import Campus  from '../models/Campus.js';
import Usuario from '../models/Usuario.js';
//import DbConnect from '../config/dbConnect.js';

export default async function usuarioSeed() {
     
    // Coleta os campus cadastrados no banco de dados
    const campusList = await Campus.find({});

    // Deleta todos os usuários existentes no banco de dados
    await Usuario.deleteMany({ nome: { $ne: "admin" } });

    // Gera 50 usuários
    for(let i = 0; i < 50; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const usuario = {
            campus: randomCampus._id.toString(),
            nome: `${fakerbr.name.firstName()} ${fakerbr.name.lastName()}`,
            cpf: fakerbr.br.cpf(),
            email: fakerbr.internet.email(),
            senha: fakerbr.internet.password(8),
            cargo: fakerbr.random.arrayElement(["Comissionado", "Funcionario Cpalm"]),
            status: fakerbr.random.boolean()
        };

        await Usuario.create(usuario);
    }

    console.log("Usuários implementadas com sucesso.");
}

// await DbConnect.conectar();
// await usuarioSeed();