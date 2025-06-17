import Rota from "../models/Rota.js";
import Usuario from "../models/Usuario.js";

class PermissionService {
    async hasPermission(userId, rota, dominio, metodo) {
        const usuario = await Usuario.findById(userId);
        if (!usuario) return false;

        if (usuario.cargo === 'Funcionario Cpalm') return true;

        const rotaDB = await Rota.findOne({ rota, dominio, ativo: true });
        if (!rotaDB) return false;

        // Verificando permissão de acordo com o método
        switch(metodo) {
            case 'buscar': return rotaDB.buscar;
            case 'enviar': return rotaDB.enviar;
            case 'substituir': return rotaDB.substituir;
            case 'modificar': return rotaDB.modificar;
            case 'excluir': return rotaDB.excluir;
        }
    }
}

export default new PermissionService();