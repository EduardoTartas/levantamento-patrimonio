import CampusRepository from "../CampusRepository.js";

class InventarioFilterBuilder {
    constructor() {
        this.filtros = {};
        this.campusRepository = new CampusRepository();
    }

    comNome(nome) {
        if (!nome || typeof nome !== 'string' || nome.trim() === '') return this;
    
        const nomeEscaped = this.escapeRegex(nome.trim());
        if (nome.trim().length === 1) {
            this.filtros.nome = { $regex: `^${nomeEscaped}`, $options: "i" };
        } else {
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
        if (!campus || typeof campus !== 'string' || campus.trim() === '') return this;
        
        const campusEncontrados = await this.campusRepository.buscarPorNome(campus.trim());
        
        const campusIds = campusEncontrados
            ? Array.isArray(campusEncontrados)
                ? campusEncontrados.map((c) => c._id)
                : (typeof campusEncontrados === 'object' && campusEncontrados._id ? [campusEncontrados._id] : [])
            : [];
        
        this.filtros.campus = { $in: campusIds };
        
        return this;
    }

    comData(data) {
        if (!data) return this;

        let dateObjCandidate;
        let isStringDateForUTCRange = false;

        if (typeof data === 'string') {
            const trimmedData = data.trim();
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedData)) {
                const parts = trimmedData.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);

                const tempDate = new Date(year, month - 1, day);
                if (tempDate.getFullYear() === year && tempDate.getMonth() === month - 1 && tempDate.getDate() === day) {
                    dateObjCandidate = tempDate;
                    isStringDateForUTCRange = true;
                }
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedData)) {
                dateObjCandidate = new Date(trimmedData);
                if (!isNaN(dateObjCandidate.getTime())) {
                    isStringDateForUTCRange = true;
                }
            } else {
                dateObjCandidate = new Date(trimmedData);
            }
        } else if (data instanceof Date) {
            dateObjCandidate = data;
        }

        if (dateObjCandidate && !isNaN(dateObjCandidate.getTime())) {
            let startDate, endDate;

            if (isStringDateForUTCRange) {
                let year, monthIndex, dayOfMonth;

                if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data.trim())) {
                     year = dateObjCandidate.getFullYear();
                     monthIndex = dateObjCandidate.getMonth();
                     dayOfMonth = dateObjCandidate.getDate();
                } else {
                     year = dateObjCandidate.getUTCFullYear();
                     monthIndex = dateObjCandidate.getUTCMonth();
                     dayOfMonth = dateObjCandidate.getUTCDate();
                }
                startDate = new Date(Date.UTC(year, monthIndex, dayOfMonth, 0, 0, 0, 0));
                endDate = new Date(Date.UTC(year, monthIndex, dayOfMonth, 23, 59, 59, 999));
            } else {
                startDate = new Date(dateObjCandidate.getTime());
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date(dateObjCandidate.getTime());
                endDate.setHours(23, 59, 59, 999);
            }
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                 this.filtros.data = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
        }
        return this;
    }

    escapeRegex(texto) {
        if (typeof texto !== 'string') return '';
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    build() {
        return this.filtros;
    }
}

export default InventarioFilterBuilder;
