import Sala from '../../models/Sala.js';
import SalaRepository from '../SalaRepository.js';

class SalaFilterBuilder {
    constructor() {
        this.filtros = {};
        this.salaRepository = new SalaRepository();
        this.salaModel = Sala;
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

    comCampus(campusId) {
        if (!campusId) return this;
        
        if (/^[0-9a-fA-F]{24}$/.test(campusId)) {
            this.filtros.campus = campusId;
        }
        
        return this; 
    }
    
    comBloco(bloco) {
        if (!bloco) return this;
        
        const blocoEscaped = this.escapeRegex(bloco);
        this.filtros.bloco = { $regex: blocoEscaped, $options: "i" };
        
        return this;
    }

    escapeRegex(texto) {
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    build() {
        return this.filtros;
    }
}

export default SalaFilterBuilder;