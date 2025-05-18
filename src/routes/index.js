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
import importacao from './importacaoRoutes.js';
import levantamento from './levantamentoRoutes.js';
import login from './loginRoutes.js';
import relatorio from './relatorioRoutes.js';
import campus from './campusRoutes.js';

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
        importacao,
        levantamento,
        login,
        relatorio,
        campus
       
    );

};

export default routes;
