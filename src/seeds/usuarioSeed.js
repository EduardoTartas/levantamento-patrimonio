import fakerbr from 'faker-br';
import DbConnect from '../config/dbConnect.js';
import Campus from '../models/Campus.js';
import Usuario from '../models/Usuario.js';

await DbConnect.conectar();

export default async function usuarioSeed() {
     
    const campusList = await Campus.find({});

    if (campusList.length === 0) {
        console.log("Nenhum campus encontrado.");
        return;
    }    

    for(let i = 0; i < 20; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const usuario = {
            campus: randomCampus._id,
            nome: fakerbr.nome.findName(),
            cpf: fakerbr.br.cpf(),
            email: fakerbr.internet.email(),
            senha: fakerbr.internet.password(8),
            cargo: fakerbr.name.jobTitle(),
            status: fakerbr.random.boolean()
        };

        await Usuario.create(usuario);
    }

    console.log("Usuários implementadas com sucesso.");
}