import examplesSchemas from "../schemas/examplesSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js"; // ajuste o caminho conforme necessário


const examplesRoutes = {
    "/examples": {
        get: {
            tags: ["Examples"],
            summary: "Lista todos os examples",
            description: `
        + Caso de uso: Listagem de examples para gerenciamento e consulta.
        
        + Função de Negócio:
            - Permitir à front-end, App Mobile e serviços server-to-server obter uma lista paginada de examples cadastrados.
            + Recebe como query parameters (opcionais):
                • filtros: nome, email, ativo, grupo, unidade.  
                • paginação: page (número da página), limite (quantidade de itens por página).

        + Regras de Negócio:
            - Validar formatos e valores dos filtros fornecidos.  
            - Respeitar as permissões do usuário autenticado (por exemplo, administradores veem todos, demais apenas os de sua secretaria).  
            - Aplicar paginação e retornar metadados: total de registros e total de páginas.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **ExampleListagem**, contendo:
                • **items**: array de examples.  
                • **dados de paginação**: totalDocs, limit, totalPages, page, pagingCounter, hasPrevPage, hasNextPage, prevPage, nextPage.
      `,
            security: [{ bearerAuth: [] }],
            parameters: generateParameters(examplesSchemas.ExampleFiltro),
            responses: {
                200: commonResponses[200](examplesSchemas.ExampleListagem),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
    },
    "/examples/{id}": {
        get: {
            tags: ["Examples"],
            summary: "Obtém detalhes de um usuário",
            description: `
            + Caso de uso: Consulta de detalhes de usuário específico.
            
            + Função de Negócio:
                - Permitir à front-end, App Mobile ou serviços obter todas as informações de um usuário cadastrado.
                + Recebe como path parameter:
                    - **id**: identificador do usuário (MongoDB ObjectId).

            + Regras de Negócio:
                - Validação do formato do ID.
                - Verificar existência do usuário e seu status (ativo/inativo).  
                - Checar permissões do solicitante para visualizar dados sensíveis.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **ExampleDetalhes**, contendo dados completos do usuário.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                    }
                }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/ExampleDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
    },
};

export default examplesRoutes;
