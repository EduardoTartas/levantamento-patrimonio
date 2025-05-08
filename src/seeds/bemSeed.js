import fakerbr from 'faker-br';
import Bem     from '../models/Bem.js';
import Sala    from '../models/Sala.js';
//import DbConnect from '../config/dbConnect.js';

export default async function bemSeed() {

    // Coleta as salas cadastradas no banco de dados
    const salaList = await Sala.find({});

    // Deleta todos os bens existentes no banco de dados
    await Bem.deleteMany({});

    // Gera 50 bens com base nas salas disponíveis
    for (let i = 0; i < 1500; i++) {
        const randomSala = salaList[Math.floor(Math.random() * salaList.length)];
        const bem = {
            sala: randomSala._id,
            nome: fakerbr.commerce.productName(),
            tombo: fakerbr.random.number({ min: 100000, max: 999999 }).toString(),
            responsavel: fakerbr.name.findName(),
            descricao: fakerbr.lorem.sentence(),
            valor: parseFloat(fakerbr.commerce.price()),
            auditado: fakerbr.random.boolean(),
            ocioso: fakerbr.random.boolean(),
        };
            await Bem.create(bem);
    }

    console.log("Seeds dos bens implementados com sucesso.");
}

//await DbConnect.conectar();
//await seedBens();