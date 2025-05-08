import fakerbr from 'faker-br';
import Sala from '../models/Sala.js';
import DbConnect from '../config/dbConnect.js';
import Campus from '../models/Campus.js';

await DbConnect.conectar();

export default async function salaSeed() {
     
    // Busca todos os campus existentes
    const campusList = await Campus.find({});

    if (campusList.length === 0) {
        console.log("Nenhum campus encontrado.");
        return;
    }    

    for(let i = 0; i < 20; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const sala = {
            campus: randomCampus._id,
            nome: fakerbr.lorem.word(),
            bloco: fakerbr.lorem.word(),
        };

        await Sala.create(sala);
    }

    console.log("Salas implementadas com sucesso.");
}