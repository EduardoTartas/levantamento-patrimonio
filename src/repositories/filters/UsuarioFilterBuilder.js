import Usuario from "../../models/Usuario.js";
import UsuarioRepository from "../UsuarioRepository.js";
import CampusRepository from "../CampusRepository.js";

class UsuarioFilterBuilder {
  constructor() {
    this.filtros = {};
    this.usuarioRepository = new UsuarioRepository();
    this.usuarioModel = Usuario;
    this.campusRepository = new CampusRepository();
  }

  comNome(nome) {
    if (!nome) return this;
    
    const nomeEscaped = this.escapeRegex(nome);
    if (nome.length === 1) {
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

  escapeRegex(texto) {
    return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  build() {
    return this.filtros;
  }
}

export default UsuarioFilterBuilder;
