import mongoose from "mongoose";
import dotenv from "dotenv";

import DbConnect from "../config/dbConnect.js";

import usuarioSeed from "./usuarioSeed.js";
import campusSeed from "./campusSeed.js";
import salaSeed from "./salaSeed.js";
import inventarioSeed from "./inventarioSeed.js";
import bemSeed from "./bemSeed.js";
import levantamentoSeed from "./levantamentoSeed.js";

dotenv.config();

async function main() {
    try {
        // Conecta ao banco de dados
        await DbConnect.conectar();

        console.log(">>> Iniciando execução das seeds... <<<");

        // Executa as seeds na ordem correta
        console.log("Executando seed de Campus...");
        await campusSeed();

        console.log("Executando seed de Usuários...");
        await usuarioSeed();

        console.log("Executando seed de Salas...");
        await salaSeed();

        console.log("Executando seed de Inventários...");
        await inventarioSeed();

        console.log("Executando seed de Bens...");
        await bemSeed();

        console.log("Executando seed de Levantamentos...");
        await levantamentoSeed();

        console.log(">>> Todas as seeds foram executadas com sucesso! <<<");
    } catch (err) {
        console.error("Erro ao executar as seeds:", err);
    } finally {
        await DbConnect.desconectar();
        console.log(">>> Conexão com o banco de dados encerrada <<<");
        return
    }
}

// Executa todas as seeds
await main();
process.exit(0);