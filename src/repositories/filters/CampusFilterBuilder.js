import Campus from '../../models/Campus.js';
import CampusRepository from '../CampusRepository.js';

class CampusFilterBuilder {
    constructor() {
        this.filtros = {};
        this.campusRepository = new CampusRepository();
        this.campusModel = Campus;
    }

    comNome(nome) {
        if (nome) {
            this.filtros.nome = { $regex: nome, $options: 'i' };
        }
        return this;
    }

    comCidade(cidade) {
        if (cidade) {
            this.filtros.cidade = { $regex: cidade, $options: 'i' };
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

    build() {
        return this.filtros;
    }
}

export default CampusFilterBuilder;
