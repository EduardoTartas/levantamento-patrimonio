import Bem from '../../models/Bem.js';
import BemRepository from '../BemRepository.js';

class BemFilterBuilder {
    constructor() {
        this.filtros = {};
        this.bemRepository = new BemRepository();
        this.bemModel = Bem;
        this._nomeSala = null; // Adicionando campo para armazenar o nome da sala
    }

    comNome(nome) {
        if (!nome) return this;

        const nomeEscaped = this.escapeRegex(nome);
        if (nome.length === 1) {
            this.filtros.nome = { $regex: `^${nomeEscaped}`, $options: "i" };
        }
        else {
            this.filtros.nome = { $regex: nomeEscaped, $options: "i" };
        }

        return this;
    }
    
    comTombo(tombo) {
        if (!tombo) return this;
        
        const tomboEscaped = this.escapeRegex(tombo);
        this.filtros.tombo = { $regex: tomboEscaped, $options: "i" };
        
        return this;
    }    
    comSala(salaId) {
        if (!salaId) return this;
        
        if (/^[0-9a-fA-F]{24}$/.test(salaId)) {
            this.filtros.sala = salaId;
        }
        
        return this;
    }

    comResponsavel(responsavel) {
        if (!responsavel) return this;
        
        const responsavelEscaped = this.escapeRegex(responsavel);
        this.filtros["responsavel.nome"] = { $regex: responsavelEscaped, $options: "i" };
        
        return this;
    }
    
    comAuditado(auditado) {
        if (auditado === "true" || auditado === true) {
            this.filtros.auditado = true;
        }
        else if (auditado === "false" || auditado === false) {
            this.filtros.auditado = false;
        }
        return this;
    }

    getNomeSala() {
        return this._nomeSala;
    }

    escapeRegex(texto) {
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    build() {
        return this.filtros;
    }
}

export default BemFilterBuilder;