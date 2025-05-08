import fakerbr from 'faker-br';
import Sala    from '../models/Sala.js';
import Campus  from '../models/Campus.js';
//import DbConnect from '../config/dbConnect.js';

export default async function salaSeed() {
     
    // Busca todos os campus existentes
    const campusList = await Campus.find({});

    // Deleta todas as salas existentes no banco de dados
    Sala.deleteMany({});

    // Gera 20 salas
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

//await DbConnect.conectar();
//await salaSeed();