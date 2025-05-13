// BIBLIOTECAS
import express from "express";
//import swaggerJsDoc from "swagger-jsdoc";
//import swaggerUI from "swagger-ui-express";
//import getSwaggerOptions from "../docs/config/head.js";
import dotenv from "dotenv";

// MIDDLEWARES
import logRoutes from "../middlewares/LogRoutesMiddleware.js";

//routes
import usuarios from './usuarioRoutes.js';
//import grupos from './grupoRoutes.js';
//import rotas from './rotaRoutes.js';
//import unidades from './unidadeRoutes.js';
//import auth from './authRoutes.js';
//import cursos from "./cursoRoutes.js";
//import turmas from "./turmaRoutes.js";
//import estudantes from "./estudanteRoutes.js";
//import projetos from "./projetoRoutes.js";
//import estagios from "./estagioRoutes.js";
//import refeicaoTurmas from "./refeicaoTurmaRoutes.js";
//import refeicoes from "./refeicoesRoutes.js";

dotenv.config();

const routes = (app) => {
    if (process.env.DEBUGLOG) {
        app.use(logRoutes);
    }
    // rota para encaminhar da raiz para /docs
    app.get("/", (req, res) => {
        res.redirect("/docs");
    });

    // Configuração do Swagger e criação da rota /docs
    /*const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    app.use(swaggerUI.serve);
    app.get("/docs", (req, res, next) => {
        swaggerUI.setup(swaggerDocs)(req, res, next);
    });*/

    app.use(express.json(),
    
        usuarios,
       
    );

};

export default routes;
