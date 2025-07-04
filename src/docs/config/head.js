import authPaths from "../paths/auth.js";
import usuariosPaths from "../paths/usuarios.js";
import campusPaths from "../paths/campus.js";
import inventariosPaths from "../paths/inventarios.js";
import authSchemas from "../schemas/authSchema.js";
import usuariosSchemas from "../schemas/usuariosSchema.js";
import campusSchemas from "../schemas/campusSchema.js";
import inventariosSchemas from "../schemas/inventarioSchema.js";

// Função para definir as URLs do servidor dependendo do ambiente
const getServersInCorrectOrder = () => {
    const API_PORT = process.env.PORT || 3001;
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
                    name: "Campus",
                    description: "Rotas para gestão de campus"
                },
                {
                    name: "Inventários",
                    description: "Rotas para gestão de inventários"
                }
            ],
            paths: {
                ...authPaths,
                ...usuariosPaths,
                ...campusPaths,
                ...inventariosPaths
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
                    ...campusSchemas,
                    ...inventariosSchemas
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
