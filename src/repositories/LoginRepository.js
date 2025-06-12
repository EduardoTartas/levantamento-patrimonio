import Usuario from '../models/Usuario.js';

export class LoginRepository {
  async buscarPorEmail(email) {
    // Busca no banco de dados um usuário com o email fornecido, incluindo o campo 'senha'
    return Usuario.findOne({ email }).select('+senha');
  }

  async buscarPorId(id) {
    // Busca usuário pelo ID (sem incluir a senha)
    return Usuario.findById(id);
  }

  async atualizarSenha(id, novaSenha) {
    return Usuario.findByIdAndUpdate(id, { senha: novaSenha });
  }
}
