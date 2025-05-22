import Inventario from "../../models/Inventario.js";
import InventarioRepository from "../InventarioRepository.js";
import CampusRepository from "../CampusRepository.js";

class InventarioFilterBuilder {
    constructor() {
        this.filtros = {};
        this.inventarioRepository = new InventarioRepository();
        this.InventarioModel = Inventario;
        this.campusRepository = new CampusRepository();
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

    comAtivo(ativo) {
        if (ativo === "true" || ativo === true) {
            this.filtros.status = true;
        } else if (ativo === "false" || ativo === false) {
            this.filtros.status = false;
        }
        return this;
    }

    async comCampus(campus) {
        if (!campus) return this;
        
        const campusEncontrados = await this.campusRepository.buscarPorNome(campus);
        
        const campusIds = campusEncontrados
            ? Array.isArray(campusEncontrados)
                ? campusEncontrados.map((u) => u._id)
                : [campusEncontrados._id]
            : [];
        
        this.filtros.campus = { $in: campusIds };
        
        return this;
    }

   comData(data) {
        if (data) {
            let dateParts;
            let dateObj;

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
                dateParts = data.split('/');
                dateObj = new Date(
                    parseInt(dateParts[2], 10),
                    parseInt(dateParts[1], 10) - 1,
                    parseInt(dateParts[0], 10)
                );
            } else {
                dateObj = new Date(data);
            }

            if (!isNaN(dateObj.getTime())) {
                const startDate = new Date(dateObj);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(dateObj);
                endDate.setHours(23, 59, 59, 999);

                this.filtros.data = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
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

export default InventarioFilterBuilder;
