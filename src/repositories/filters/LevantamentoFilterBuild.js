import Levantamento from '../../models/Levantamento.js';

class LevantamentoFilterBuilder {
    constructor() {
        this.filtros = {};
        this.levantamentoModel = Levantamento;
    }

    comInventario(inventarioId) {
        if (!inventarioId) return this;
        
        if (/^[0-9a-fA-F]{24}$/.test(inventarioId)) {
            this.filtros.inventario = inventarioId;
        }
        
        return this;
    }

    comEstado(estado) {
        if (!estado) return this;
        
        const estadosValidos = ["Em condições de uso", "Inservível", "Danificado"];
        if (estadosValidos.includes(estado)) {
            this.filtros.estado = estado;
        }
        
        return this;
    }

    comUsuario(usuarioId) {
        if (!usuarioId) return this;
        
        if (/^[0-9a-fA-F]{24}$/.test(usuarioId)) {
            this.filtros.usuario = usuarioId;
        }
        
        return this;
    }

    comOcioso(ocioso) {
        if (ocioso === "true" || ocioso === true) {
            this.filtros.ocioso = true;
        }
        else if (ocioso === "false" || ocioso === false) {
            this.filtros.ocioso = false;
        }
        return this;
    }

    comTombo(tombo) {
        if (!tombo) return this;
        
        const tomboEscaped = this.escapeRegex(tombo);
        this.filtros["bem.tombo"] = tomboEscaped;
        
        return this;
    }

    comNomeBem(nome) {
        if (!nome) return this;

        const nomeEscaped = this.escapeRegex(nome);
        if (nome.length === 1) {
            this.filtros["bem.nome"] = { $regex: `^${nomeEscaped}`, $options: "i" };
        }
        else {
            this.filtros["bem.nome"] = { $regex: nomeEscaped, $options: "i" };
        }

        return this;
    }

    escapeRegex(texto) {
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    build() {
        return this.filtros;
    }
}

export default LevantamentoFilterBuilder;
