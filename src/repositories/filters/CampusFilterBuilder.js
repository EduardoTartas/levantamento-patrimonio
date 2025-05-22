import Campus from '../../models/Campus.js';
import CampusRepository from '../CampusRepository.js';

class CampusFilterBuilder {
    constructor() {
        this.filtros = {};
        this.campusRepository = new CampusRepository();
        this.campusModel = Campus;
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

    comCidade(cidade) {
        if (cidade) {
            cidadeEscaped = this.escapeRegex(cidade);
            this.filtros.cidade = { $regex: cidadeEscaped, $options: 'i' };
        }
        return this;
    }

    comAtivo(ativo) {
        if (ativo === "true" || ativo === true) {
            this.filtros.status = true;
        } 
        else if (ativo === "false" || ativo === false) {
            this.filtros.status = false;
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

export default CampusFilterBuilder;
