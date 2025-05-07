import DbConnect from '../config/dbConnect.js';
import Campus from '../models/Campus.js';

await DbConnect.conectar();

const campusModel = new Campus().model;

async function seedCampus() {
    try {
        await campusModel.create([
            {
                nome: "IFRO - Campus Vilhena",
                telefone: "3322-4556",
                cidade: "Vilhena",
                bairro: "São Vicente",
                rua: "Vale Alonso",
                numeroResidencia: "900",
            },
            {
                nome: "IFRO - Campus Colorado",
                telefone: "3321-3222",
                cidade: "Colorado",
                bairro: "Pitesburgo",
                rua: "Jairo Abelardo",
                numeroResidencia: "500",
            },
            {
                nome: "IFRO - Campus Cerejeiras",
                telefone: "3322-8890",
                cidade: "Cerejeiras",
                bairro: "Jardim Clemência",
                rua: "Antônio Vasquez Brasil",
                numeroResidencia: "600",
            },
        ])

        console.log("Os seeds dos campus foram implementados.");

    } catch (err) {
        console.error("Erro ao implementar seeds dos Campus", err);
    } finally {
        await DbConnect.desconectar()
    }
}

export default seedCampus