import fakerbr from 'faker-br';
import Sala from '../models/Sala.js';
import DbConnect from '../config/dbConnect.js';
import campus from '../models/Campus.js'

export default async function seedSala() {
     
    // Busca todos os campus existentes
    const randomCampusList = campus.find({})


    for(let i = 0; i < 20; i++) {
        const sala = {
            campus: randomCampusList._id,
            nome: fakerbr.lorem.word(15),
            bloco: fakerbr.lorem.word(10),
        }

    }

}

await DbConnect.conectar()
seedSala()