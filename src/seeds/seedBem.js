import DbConnect from '../config/dbConnect.js';
import Bem from '../models/Bem.js'

await DbConnect.conectar();

const bemModel = new Bem().model;

async function seedBens() {
    try {
        await bemModel.create([
            {
                sala: "", // O seed sala precisa ser feito, para adcionar o seu ObjectID aqui em seeds dos bens
                nome: "Monitor Sony 24''",
                tombo: "334455",
                responsavel: "Thiago Hens",
                descricao: "Monitor Full HD com entrada HDMI.",
                valor: 950.00,
                auditado: true,
                ocioso: false,
            },
            {
                sala: "",
                nome: "Cadeira Fixa Ergoplax preta",
                tombo: "413121",
                responsavel: "Eduardo Tartas",
                descricao: "Cadeira preta da marca Ergoplax, em excelente estado.",
                valor: 230.00,
                auditado: true,
                ocioso: false,
            },
            {
                sala: "",
                nome: "Mouse Maxprint Universitário",
                tombo: "152535",
                responsavel: "Gustavo Oliveira",
                descricao: "O Mouse Universitario USB2.0 da cor preta.",
                valor: 50.00,
                auditado: true,
                ocioso: false,
            },
        ]);

        console.log("Seeds dos bens implementados.");

    } catch (err) {
        console.error("Erro ao implementar seed do bem", err);
    } finally {
        await DbConnect.desconectar()
    }
}

export default seedBens