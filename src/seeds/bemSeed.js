import fakerbr from 'faker-br';
import Bem from '../models/Bem.js';
import Sala from '../models/Sala.js';

export default async function bemSeed() {

    // Coleta as salas cadastradas no banco de dados
    const salaList = await Sala.find({});

    if (salaList.length === 0) {
        console.log("Nenhuma sala encontrada. Execute salaSeed primeiro.");
        return;
    }

    // Deleta todos os bens existentes no banco de dados
    await Bem.deleteMany({});

    // Gera 1500 bens com base nas salas disponíveis
    for (let i = 0; i < 1500; i++) {
        const randomSala = salaList[Math.floor(Math.random() * salaList.length)];
        
        const bem = {
            sala: randomSala._id,
            nome: fakerbr.commerce.productName(),
            tombo: fakerbr.random.number({ min: 100000, max: 999999 }).toString(),
            responsavel: {
                nome: fakerbr.name.findName(),
                cpf: fakerbr.br.cpf(), 
            },
            descricao: fakerbr.lorem.sentence(),
            valor: parseFloat(fakerbr.commerce.price()),
            auditado: fakerbr.random.boolean(),
        };

        await Bem.create(bem);
    }

    console.log("Seeds dos bens implementados com sucesso.");
}

//await DbConnect.conectar();
//await seedBens();