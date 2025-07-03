import estagiosSchemas from "../schemas/estagiosSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js"; // ajuste o caminho conforme necessário

const estagiosRoutes = {
    "/estagios": {
        get: {
            tags: ["Estágios"],
            summary: "Lista todos os estagios",
            description: "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            // Gerando os parâmetros a partir do JSON Schema recursivamente
            parameters: generateParameters(estagiosSchemas.EstagioFiltro),
            responses: {
                200: commonResponses[200]("#/components/schemas/EstagioListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Estágios"],
            summary: "Cria um novo estagio",
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/EstagioPost"
                        }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/EstagioDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },
    "/estagios/{id}": {
        get: {
            tags: ["Estágios"],
            summary: "Obtém detalhes de um estagio",
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
                200: commonResponses[200]("#/components/schemas/EstagioDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        put: {
            tags: ["Estágios"],
            summary: "Atualiza um estagio",
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
                            $ref: "#/components/schemas/EstagioPutPatch"
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/EstagioDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Estágios"],
            summary: "Deleta um estagio",
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

export default estagiosRoutes;
