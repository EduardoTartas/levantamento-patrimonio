import suppliersSchemas from "../schemas/suppliersSchema.js";
import authSchemas from "../schemas/authSchema.js";
import commonResponses from "../schemas/swaggerCommonResponses.js";
import { generateParameters } from "./utils/generateParameters.js"; // ajuste o caminho conforme necessário


const suppliersRoutes = {
    "/suppliers": {
        get: {
           tags: ["Fornecedores"],
            summary: "Lista todos os fornecedores",
            description: `
        + Caso de uso: Listagem de fornecedores para gerenciamento e consulta.
        
        + Função de Negócio:
            - Permitir à front-end, App Mobile e serviços server-to-server obter uma lista paginada de fornecedores cadastrados.
            + Recebe como query parameters (opcionais):
                • filtros: nome, email, ativo, cnpj, telefone.
                • paginação: page (número da página), limite (quantidade de itens por página).

        + Regras de Negócio:
            - Validar formatos e valores dos filtros fornecidos.  
            - Respeitar as permissões do fornecedor autenticado (por exemplo, administradores veem todos, demais apenas os de seu grupo).  
            - Aplicar paginação e retornar metadados: total de registros e total de páginas.

        + Resultado Esperado:
            - 200 OK com corpo conforme schema **SupplierListagem**, contendo:
                • **items**: array de fornecedores.  
                • **dados de paginação**: totalDocs, limit, totalPages, page, pagingCounter, hasPrevPage, hasNextPage, prevPage, nextPage.
      `,
            security: [{ bearerAuth: [] }],
            parameters: generateParameters(suppliersSchemas.SupplierFiltro),
            responses: {
                200: commonResponses[200](suppliersSchemas.SupplierListagem),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },

        post: {
           tags: ["Fornecedores"],
            summary: "Cria um novo fornecedor",
            description: `
            + Caso de uso: Criação de novo fornecedor no sistema.
            
            + Função de Negócio:
                - Permitir ao perfil administrador inserir um novo fornecedor com todos os dados obrigatórios.
                + Recebe no corpo da requisição:
                    - Objeto conforme schema **SupplierPost**, contendo campos como nome, email, cnpj, telefone, endereço, etc.

            + Regras de Negócio:
                - Validação de campos obrigatórios (nome, email, cnpj, etc.). 
                - Verificação de unicidade para campos únicos (email, cnpj, telefone).
                - Definição de status inicial (ex.: ativo ou false) de acordo com o fluxo de cadastro.  
                - Em caso de duplicidade ou erro de validação, retorna erro apropriado.

            + Resultado Esperado:
                - HTTP 201 Created com corpo conforme **SupplierDetalhes**, contendo todos os dados do fornecedor criado.
      `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/SupplierPost"
                        }
                    }
                }
            },
            responses: {
                201: commonResponses[201]("#/components/schemas/SupplierDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },
    "/suppliers/{id}": {
        get: {
           tags: ["Fornecedores"],
            summary: "Obtém detalhes de um fornecedor",
            description: `
            + Caso de uso: Consulta de detalhes de fornecedor específico.
            
            + Função de Negócio:
                - Permitir à front-end, App Mobile ou serviços obter todas as informações de um fornecedor cadastrado.
                + Recebe como path parameter:
                    - **id**: identificador do fornecedor (MongoDB ObjectId).

            + Regras de Negócio:
                - Validação do formato do ID.
                - Verificar existência do fornecedor e seu status (ativo/inativo).

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **SupplierDetalhes**, contendo dados completos do fornecedor.
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
                200: commonResponses[200]("#/components/schemas/SupplierDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },
        patch: {
           tags: ["Fornecedores"],
            summary: "Atualiza um fornecedor (PATCH)",
            description: `
            + Caso de uso: Atualização parcial de dados do fornecedor.
            
            + Função de Negócio:
                - Permitir ao perfil administrador ou fornecedor autorizado modificar os campos desejados.
                + Recebe:
                    - **id** no path.  
                    - No corpo, objeto conforme **SupplierPutPatch** com os campos a alterar.

            + Regras de Negócio:
                - Garantir unicidade de campos como email, cnpj, telefone.
                - Aplicar imediatamente alterações críticas (ex.: desativação inibe uso em opreções posteriores).  
                - Impedir alterações inconsistentes com regras de negócio.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **SupplierDetalhes**, refletindo as alterações.
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
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/SupplierPutPatch"
                        }
                    }
                }
            },
            responses: {
                200: commonResponses[200]("#/components/schemas/SupplierDetalhes"),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        },

        delete: {
           tags: ["Fornecedores"],
            summary: "Deleta um fornecedor",
            description: `
            + Caso de uso: Exclusão ou inativação de fornecedor.
            
            + Função de Negócio:
                - Permitir ao perfil administrador remover ou inativar um fornecedor sem afetar integridade de dados.
                + Recebe como path parameter:
                    - **id**: identificador do fornecedor.

            + Regras de Negócio:
                - Verificar impedimentos por relacionamento (conformidade ou auditoria) antes de excluir. (Não há) 
                - Registrar log de auditoria sobre a operação.  
                - Garantir que não haja vínculos críticos pendentes.

            + Resultado Esperado:
                - HTTP 200 OK - fornecedor excluído ou inativado com sucesso.
      
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
                200: commonResponses[200](),
                400: commonResponses[400](),
                401: commonResponses[401](),
                404: commonResponses[404](),
                498: commonResponses[498](),
                500: commonResponses[500]()
            }
        }
    },

};

export default suppliersRoutes;
