import fakerbr      from 'faker-br';
import Inventario   from '../models/Inventario.js';
import Sala         from '../models/Sala.js';
import Usuario      from '../models/Usuario.js';
import Levantamento from '../models/Levantamento.js';
import Bem          from '../models/Bem.js';

export default async function levantamentoSeed() {

    // Coleta os inventários, salas, usuários e bens cadastrados no banco de dados
    const inventarioList = await Inventario.find({});
    const salaList = await Sala.find({});
    const usuarioList = await Usuario.find({});
    const bemList = await Bem.find({});

    // Deleta todos os levantamentos existentes no banco de dados
    await Levantamento.deleteMany({});

    // Gera 800 levantamentos
    for (let i = 0; i < 800; i++) {
        const randomInventario = inventarioList[Math.floor(Math.random() * inventarioList.length)];
        const randomSala = salaList[Math.floor(Math.random() * salaList.length)];
        const randomUsuario = usuarioList[Math.floor(Math.random() * usuarioList.length)];
        const randomBem = bemList[Math.floor(Math.random() * bemList.length)];

        const levantamento = {
            inventario: randomInventario._id,
            bem: {
                id: randomBem._id,
                salaId: randomBem.sala || randomSala._id,
                nome: randomBem.nome || fakerbr.commerce.productName(),
                tombo: randomBem.tombo || fakerbr.random.alphaNumeric(6),
                descricao: randomBem.descricao || `${fakerbr.commerce.productName()}. ${fakerbr.lorem.sentence()}`,
                responsavel: {
                    nome: randomBem.responsavel?.nome || fakerbr.name.findName(),
                    cpf: randomBem.responsavel?.cpf || fakerbr.br.cpf()
                }
            },
            usuario: randomUsuario._id,
            estado: fakerbr.random.arrayElement(["Em condições de uso", "Inservível", "Danificado"]),
            ocioso: fakerbr.random.boolean(),
            createdAt: fakerbr.date.past(),
            updatedAt: fakerbr.date.recent()
        };

        await Levantamento.create(levantamento);
    }

    console.log("Levantamentos gerados com sucesso");
}