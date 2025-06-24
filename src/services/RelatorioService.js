import InventarioService from "./InventarioService.js";
import SalaService from "./SalaService.js";
import BemRepository from "../repositories/BemRepository.js";
import PDFDocument from "pdfkit";
import { CustomError } from "../utils/helpers/index.js";
import Levantamento from "../models/Levantamento.js";

class RelatorioService {
    constructor() {
        this.inventarioService = new InventarioService();
        this.salaService = new SalaService();
    }

    async gerarRelatorio(query) {
        const { inventarioId, sala, tipoRelatorio } = query;

        if (!inventarioId || !tipoRelatorio) {
            throw new CustomError({
                customMessage: "inventarioId e tipoRelatorio são obrigatórios.",
                statusCode: 400
            });
        }

        await this.inventarioService.ensureInvExists(inventarioId);
        if (sala) await this.salaService.ensureSalaExists(sala);

        const todosBens = await this._buscarLevantamentos({ inventarioId, sala, tipoRelatorio });

        const pdfBuffer = await this._gerarPDF(todosBens, tipoRelatorio);
        return pdfBuffer;
    }

    async _buscarLevantamentos({ inventarioId, sala, tipoRelatorio }) {
        const filtro = { inventario: inventarioId };
        if (sala) filtro["bem.salaId"] = sala;

        const filtroPorTipo = {
            geral: () => filtro,
            bens_danificados: () => ({ ...filtro, estado: "Danificado" }),
            bens_inserviveis: () => ({ ...filtro, estado: "Inservível" }),
            bens_ociosos: () => ({ ...filtro, ocioso: true }),
            bens_nao_encontrados: () => ({ ...filtro, imagem: null }),
            bens_sem_etiqueta: () => ({ ...filtro, "bem.tombo": { $in: [null, ""] } }),
        };

        const gerarFiltro = filtroPorTipo[tipoRelatorio];

        if (!gerarFiltro) {
            throw new CustomError({
                customMessage: "Tipo de relatório inválido",
                statusCode: 400
            })
        }

        const filtroResult = gerarFiltro();

        return Levantamento
            .find(filtroResult)
            .populate("salaNova", "nome")
            .populate("usuario", "nome")
            .lean();
    }

    async _gerarPDF(levantamentos, tipoRelatorio) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            doc.fontSize(16).text(`Relatório: ${tipoRelatorio.replaceAll("_", " ")}`, { align: "center" });
            doc.moveDown();

            /* Problema a serem corrigidos com sala, a filtragem de sala não retorna nada */
            if (!levantamentos.length) {
                doc.text("Nenhum levantamento encontrado para este filtro.");
            } else {
                levantamentos.forEach((l, index) => {
                   const bem = l.bem

                   doc.fontSize(12).text(
                    `${index + 1}. Nome: ${bem.nome} | 
                    Tombo: ${bem.tombo || "Sem etiqueta"} | 
                    Estado: ${l.estado} | 
                    Ocioso: ${l.ocioso ? "Sim" : "Não"} | 
                    Sala Nova: ${l.salaNova?.nome || "-"} | 
                    Usuário: ${l.usuario?.nome || "-"}`
                   )
                });
            }

            doc.end();
        });
    }
}

export default RelatorioService;