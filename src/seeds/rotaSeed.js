import Rota from "../models/Rota.js";

export default async function rotaSeed() {
        const rotasExistentes = await Rota.countDocuments();
        
        if (rotasExistentes > 0) {
            console.log("Rotas já existem no banco de dados. Skipping seed...");
            return;
        }

        const rotas = [
            {
                rota: "usuarios",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "salas",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "relatórios",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "levantamentos",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "inventarios",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "csv",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "campus",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            },
            {
                rota: "bens",
                dominio: "localhost",
                ativo: true,
                buscar: true,
                enviar: false,
                substituir: false,
                modificar: false,
                excluir: false
            }
        ];

        await Rota.insertMany(rotas);

        console.log("Rotas inseridas com sucesso!");
}
