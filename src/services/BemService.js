import BemRepository from '../repositories/BemRepository.js';

class BemService {
    constructor() {
        this.repository = new BemRepository();
    }

    async listar(req) {
        console.log('Estou no listar em BemService');
        return await this.repository.listar(req);
    }
}

export default BemService;