import mongoose from 'mongoose';

const RotaSchema = new mongoose.Schema({
  rota: { type: String, required: true },
  dominio: { type: String, required: true },
  ativo: { type: Boolean, default: true },
  buscar: { type: Boolean, default: false },
  enviar: { type: Boolean, default: false }, 
  substituir: { type: Boolean, default: false },
  modificar: { type: Boolean, default: false }, 
  excluir: { type: Boolean, default: false } 
});

export default mongoose.model('Rota', RotaSchema);
