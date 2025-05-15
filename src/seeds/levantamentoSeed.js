import fakerbr      from 'faker-br';
import Inventario   from '../models/Inventario.js';
import Sala         from '../models/Sala.js';
import Usuario      from '../models/Usuario.js';
import Levantamento from '../models/Levantamento.js';
import Bem          from '../models/Bem.js';
import DbConnect    from '../config/dbConnect.js';

export default async function levantamentoSeed() {

    // Coleta os inventários, salas, usuários e bens cadastrados no banco de dados
    const inventarioList = await Inventario.find({});
    const salaList = await Sala.find({});
    const usuarioList = await Usuario.find({});
    const bemList = await Bem.find({});

    // Deleta todos os levantamentos existentes no banco de dados
    await Levantamento.deleteMany({});

    // Gera 100 levantamentos
    for (let i = 0; i < 800; i++) {
        const randomInventario = inventarioList[Math.floor(Math.random() * inventarioList.length)];
        const randomSala = salaList[Math.floor(Math.random() * salaList.length)];
        const randomUsuario = usuarioList[Math.floor(Math.random() * usuarioList.length)];
        const randomBem = bemList[Math.floor(Math.random() * bemList.length)];

        const levantamento = {
            inventario: randomInventario._id,
            bem: {
                id: randomBem._id, // Referência ao ObjectId do Bem
                salaID: randomBem.sala || randomSala._id, // Usa o salaID do Bem ou um aleatório
                nome: randomBem.nome || fakerbr.commerce.productName(),
                tombo: randomBem.tombo || fakerbr.random.alphaNumeric(10),
                responsavel: randomBem.responsavel || fakerbr.name.findName(),
                ocioso: randomBem.ocioso || fakerbr.random.boolean(),
            },
            sala: randomSala._id,
            usuario: randomUsuario._id,
            imagem: fakerbr.image.imageUrl(),
            estado: fakerbr.random.arrayElement(["Em condições de uso", "Inservível", "Danificado"]),
            data: fakerbr.date.past(),
        };


        await Levantamento.create(levantamento);
    }

    console.log("Levantamentos gerados com sucesso");
}