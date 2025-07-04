import unidadeSchemas from "../schemas/unidadesSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js"; // ajuste o caminho conforme necessário

const unidadesRoutes = {
    "/unidades": {
        get: {
            tags: ["Unidades"],
            summary: "Lista todas as unidades",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            // Gerando os parâmetros a partir do JSON Schema recursivamente
            parameters: generateParameters(unidadeSchemas.UnidadeFiltro),
            responses: {
                200: commonResponses[200]("#/components/schemas/UnidadeListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        post: {
            tags: ["Unidades"],
            summary: "Cria uma nova unidade",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/UnidadePost"
                        }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/UnidadeDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },
    "/unidades/{id}": {
        get: {
            tags: ["Unidades"],
            summary: "Obtém detalhes de uma unidade",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
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
                200: commonResponses[200]("#/components/schemas/UnidadeDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        patch: {
            tags: ["Unidades"],
            summary: "Atualiza uma unidade",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
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
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/UnidadePutPatch"
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/UnidadeDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        put: {
            tags: ["Unidades"],
            summary: "Atualiza uma unidade",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
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
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/UnidadePutPatch"
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/UnidadeDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        delete: {
            tags: ["Unidades"],
            summary: "Deleta uma unidade",
            description:
                "Coloque aqui uma descrição mais detalhada do que esse endpoint faz, regras de negócio, permissões, etc.",
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

export default unidadesRoutes;
