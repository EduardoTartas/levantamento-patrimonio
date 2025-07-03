import authPaths from "../paths/auth.js";
import usuariosPaths from "../paths/usuarios.js";
import authSchemas from "../schemas/authSchema.js";
import usuariosSchemas from "../schemas/usuariosSchema.js";
import gruposPaths from "../paths/grupos.js";
import gruposSchemas from "../schemas/gruposSchema.js";
import unidadesPaths from "../paths/unidades.js";
import unidadesSchemas from "../schemas/unidadesSchema.js";
import rotasPaths from "../paths/rotas.js";
import rotasSchemas from "../schemas/rotasSchema.js";
import cursoPaths from "../paths/cursos.js";
import cursosSchemas from "../schemas/cursosSchema.js";
import estudantesPaths from "../paths/estudantes.js";
import estudantesSchemas from "../schemas/estudantesSchema.js";
import turmasPaths from "../paths/turmas.js";
import turmasSchemas from "../schemas/turmasSchema.js";
import estagiosPaths from "../paths/estagios.js";
import estagiosSchemas from "../schemas/estagiosSchema.js";
import projetosPaths from "../paths/projetos.js";
import projetosSchemas from "../schemas/projetosSchema.js";
import refeicoesPaths from "../paths/refeicoes.js";
import refeicoesSchemas from "../schemas/refeicoesSchema.js";
import refeicoesTurmasPaths from "../paths/refeicoesTurmas.js";
import refeicoesTurmasSchemas from "../schemas/refeicoesTurmasSchema.js";
import suppliersPaths from "../paths/supplier.js";
import suppliersSchemas from "../schemas/suppliersSchema.js";
import examplesSchemas from "../schemas/examplesSchema.js";
import examplesPaths from "../paths/examples.js";

// Função para definir as URLs do servidor dependendo do ambiente
const getServersInCorrectOrder = () => {
    const devUrl = { url: process.env.SWAGGER_DEV_URL || `http://localhost:${API_PORT}` };
    const prodUrl1 = { url: process.env.SWAGGER_PROD_URL || "https://api-levantamento.exemplo.com" };

    if (process.env.NODE_ENV === "production") return [prodUrl1, devUrl];
    else return [devUrl, prodUrl1];
};

// Função para obter as opções do Swagger
const getSwaggerOptions = () => {
    return {
        swaggerDefinition: {
            openapi: "3.0.0",
            info: {
                title: "API Levantamento de Patrimônio",
                version: "1.0.0",
                description: "API de Levantamento de Patrimônio \n\nÉ necessário autenticar com token JWT antes de utilizar a maioria das rotas, faça isso na rota /login com um email e senha válido. Esta API conta com refresh token, que pode ser obtido na rota /token, e com logout, que pode ser feito na rota /logout. Para revogação de acesso de terceiros um perfil de administrador pode usar a rota /token/revoke Para mais informações, acesse a documentação.",
                contact: {
                    name: "Equipe de Desenvolvimento",
                    email: "eduardo.tartas@estudante.ifro.edu.br",
                },
            },
            servers: getServersInCorrectOrder(),
            tags: [
                {
                    name: "Auth",
                    description: "Rotas para autenticação e autorização"
                },
                {
                    name: "Usuários",
                    description: "Rotas para gestão de usuários"
                },
                {
                    name: "Grupos",
                    description: "Rotas para gestão de grupos"
                },
                {
                    name: "Rotas",
                    description: "Rotas para gestão de rotas disponíveis nesta API"
                },
                {
                    name: "Unidades",
                    description: "Rotas para gestão de unidades"
                },
                /**
                 * Rotas do sistema de referição
                 */
                {
                    name: "Estudantes",
                    description: "Rotas para gestão de estudantes"
                },
                {
                    name: "Cursos",
                    description: "Rotas para gestão de cursos"
                },
                {
                    name: "Turmas",
                    description: "Rotas para gestão de turmas"
                },
                {
                    name: "Estágios",
                    description: "Rotas para gestão de estágios"
                },
                {
                    name: "Projetos",
                    description: "Rotas para gestão de projetos"
                },
                {
                    name: "Refeições",
                    description: "Rotas para gestão de refeições"
                },
                {
                    name: "RefeiçõesTurmas",
                    description: "Rotas para gestão de refeições por turmas"
                },
                {
                    name: "Fornecedores",
                    description: "Rotas para gestão de fornecedores"
                },
                {
                    name: "Examples",
                    description: "Exemplos de requisições e respostas"
                }
            ],
            paths: {
                ...authPaths,
                ...usuariosPaths,
                ...gruposPaths,
                ...unidadesPaths,
                ...rotasPaths,
                /**
                 * Rotas do sistema de referição
                 */
                ...cursoPaths,
                ...estudantesPaths,
                ...turmasPaths,
                ...estagiosPaths,
                ...projetosPaths,
                ...refeicoesPaths,
                ...refeicoesTurmasPaths,
                ...suppliersPaths,

                /**
                 * Exemplos de requisições e respostas
                 */
                ...examplesPaths


            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                },
                schemas: {
                    ...authSchemas,
                    ...usuariosSchemas,
                    ...gruposSchemas,
                    ...unidadesSchemas,
                    ...rotasSchemas,

                    /**
                     * Schemas do sistema de referição
                     */
                    ...cursosSchemas,
                    ...estudantesSchemas,
                    ...turmasSchemas,
                    ...estagiosSchemas,
                    ...projetosSchemas,
                    ...refeicoesSchemas,
                    ...refeicoesTurmasSchemas,
                    ...suppliersSchemas,

                    /** 
                     * Schemas de exemplos
                     */

                    ...examplesSchemas
                }
            },
            security: [{
                bearerAuth: []
            }]
        },
        apis: ["./src/routes/*.js"]
    };
};

export default getSwaggerOptions;
