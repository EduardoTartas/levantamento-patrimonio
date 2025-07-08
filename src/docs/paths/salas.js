import salasSchemas from "../schemas/salasSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js";

const salasRoutes = {
    "/salas": {
        get: {
            tags: ["Salas"],
            summary: "Listar salas",
            description: `
        + Caso de uso: Listagem de salas para consulta e gerenciamento.
        
        + Função de Negócio:
            - Permitir à front-end, App Mobile e serviços server-to-server obter uma lista paginada de salas cadastradas.
            + Recebe como query parameters (opcionais):
                • filtros: nome, bloco, campus (ID ou nome).  
                • paginação: page (número da página), limite (quantidade de itens por página).

        + Regras de Negócio:
            - Validar formatos e valores dos filtros fornecidos.  
            - Aplicar paginação e retornar metadados: total de registros e total de páginas.
            - Incluir informações do campus relacionado (populate).

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **SalaListagem**, contendo:
                • **items**: array de salas com dados do campus.  
                • **dados de paginação**: totalDocs, limit, totalPages, page, pagingCounter, hasPrevPage, hasNextPage, prevPage, nextPage.
      `,
            security: [{ bearerAuth: [] }],
            parameters: generateParameters(salasSchemas.SalaFiltro),
            responses: {
                200: commonResponses[200]("#/components/schemas/SalaListagem"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

    "/salas/{id}": {
        get: {
            tags: ["Salas"],
            summary: "Obter sala por ID",
            description: `
        + Caso de uso: Obter detalhes completos de uma sala específica.
        
        + Função de Negócio:
            - Retornar todos os dados de uma sala identificada pelo ID.
            - Incluir informações completas do campus relacionado.

        + Regras de Negócio:
            - O ID deve ser um ObjectId válido do MongoDB.
            - A sala deve existir no banco de dados.
            - Retornar erro 404 se a sala não for encontrada.

        + Resultado Esperado:
            - 200 OK com dados da sala conforme schema **SalaDetalhes**.
            - 404 Not Found se a sala não existir.
      `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        pattern: "^[0-9a-fA-F]{24}$"
                    },
                    description: "ID único da sala (ObjectId do MongoDB)"
                }
            ],
            responses: {
                200: commonResponses[200]("#/components/schemas/SalaDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    }
};

export default salasRoutes;
