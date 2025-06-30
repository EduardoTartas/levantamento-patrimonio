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
            bens_nao_encontrados: () => ({ ...filtro, ocioso: false }),
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
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));

            // Título do Relatório
            doc.fontSize(20)
                .font("Helvetica-Bold")
                .fillColor("#000")
                .text(`Relatório: ${tipoRelatorio.replaceAll("_", " ")}`, {
                    align: "center",
                });

            doc.moveDown(2);

            // Verifica se há dados
            if (!levantamentos.length) {
                doc.fontSize(14)
                    .font("Helvetica")
                    .fillColor("red")
                    .text("Nenhum levantamento encontrado para este filtro.", {
                        align: "center"
                    });
            } else {
                // Itera sobre os levantamentos
                levantamentos.forEach((l, index) => {
                    const bem = l.bem;

                    doc.fontSize(14)
                        .font("Helvetica-Bold")
                        .fillColor("#000")
                        .text(`Item ${index + 1}`);

                    doc.moveDown(0.5);

                    doc.fontSize(12).font("Helvetica").fillColor("#333");

                    doc.text(`Nome do Bem: `, { continued: true })
                        .font("Helvetica-Bold").text(`${bem.nome}`);

                    doc.font("Helvetica").text(`Número do Tombo: `, { continued: true })
                        .font("Helvetica-Bold").text(`${bem.tombo || "Sem etiqueta"}`);

                    doc.font("Helvetica").text(`Estado Atual: `, { continued: true })
                        .font("Helvetica-Bold").text(`${l.estado}`);

                    doc.font("Helvetica").text(`Está Ocioso?: `, { continued: true })
                        .font("Helvetica-Bold").text(`${l.ocioso ? "Sim" : "Não"}`);

                    doc.font("Helvetica").text(`Nova Sala: `, { continued: true })
                        .font("Helvetica-Bold").text(`${l.salaNova?.nome || "Não informado"}`);

                    doc.font("Helvetica").text(`Usuário Responsável: `, { continued: true })
                        .font("Helvetica-Bold").text(`${l.usuario?.nome || "Não informado"}`);

                    // Linha separadora
                    doc.moveDown(1);
                    doc.strokeColor("#CCCCCC")
                        .moveTo(doc.x, doc.y)
                        .lineTo(doc.page.width - 50, doc.y)
                        .stroke();
                    doc.moveDown(1);
                });
            }

            doc.end();
        });
    }
}

export default RelatorioService;