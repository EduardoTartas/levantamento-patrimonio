import Bem from '../../models/Bem.js';
import BemRepository from '../BemRepository.js';

class BemFilterBuilder {
    constructor() {
        this.filtros = {};
        this.bemRepository = new BemRepository();
        this.bemModel = Bem;
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
        this.filtros.tombo = tomboEscaped;
        
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

    escapeRegex(texto) {
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    build() {
        return this.filtros;
    }
}

export default BemFilterBuilder;