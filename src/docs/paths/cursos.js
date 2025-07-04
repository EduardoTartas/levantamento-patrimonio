import cursosSchemas from "../schemas/cursosSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js"; // ajuste o caminho conforme necessário

const cursosRoutes = {
    "/cursos": {
        get: {
            tags: ["Cursos"],
            summary: "Lista todos os cursos",
            description: "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            // Gerando os parâmetros a partir do JSON Schema recursivamente
            parameters: generateParameters(cursosSchemas.CursoFiltro),
            responses: {
                200: commonResponses[200]("#/components/schemas/CursoListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Cursos"],
            summary: "Cria um novo curso",
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/CursoPost"
                        }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/CursoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },
    "/cursos/{id}": {
        get: {
            tags: ["Cursos"],
            summary: "Obtém detalhes de um curso",
            description: "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string"
                    }
                }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/CursoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        put: {
            tags: ["Cursos"],
            summary: "Atualiza um curso",
            description: "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/CursoPutPatch"
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/CursoDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Cursos"],
            summary: "Deleta um curso",
            description: "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string"
                    }
                }
            ],
            responses: {
                200: commonResponses[200](),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default cursosRoutes;
