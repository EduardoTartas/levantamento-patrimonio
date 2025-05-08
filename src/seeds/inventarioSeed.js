import fakerbr    from 'faker-br';
import Inventario from '../models/Inventario.js';
import Campus     from '../models/Campus.js';
//import DbConnect  from '../config/dbConnect.js';

export default async function inventarioSeed() {
    //Coleta os campus cadastrados no banco de dados
    const campusList = await Campus.find({});

    //Deleta todos os inventários existentes no banco de dados
    await Inventario.deleteMany({});

    //Gera 50 inventários
    for (let i = 0; i < 20; i++) {
        const randomCampus = campusList[Math.floor(Math.random() * campusList.length)];

        const inventario = {
            campus: randomCampus._id,
            nome:   fakerbr.lorem.word(10),
            data:   fakerbr.date.past(),
            status: fakerbr.random.boolean(),
        };

        await Inventario.create(inventario);
    }

    console.log("Inventários gerados com sucesso");
}

//DbConnect.conectar();
//inventarioSeed();