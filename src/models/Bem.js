import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const bemSchema = new mongoose.Schema({
    sala: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sala",
        required: true,
    },
    nome: {
        type: String,
        index: true,
        required: true,
    },
    tombo: {
        type: String,
        required: false,
        unique: function() { return this.tombo && this.tombo.trim() !== ''; },
        sparse: true
    },
    // --- ALTERAÇÃO AQUI ---
    responsavel: {
        nome: { 
            type: String, 
            required: true 
        },
        // O CPF agora não é mais obrigatório
        cpf: { 
            type: String, 
            required: false, // Alterado para false
            index: true
        }
    },
    descricao: {
        type: String,
    },
    valor: {
        type: Number,
        required: true,
    },
    auditado: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false
});

bemSchema.plugin(mongoosePaginate);

const Bem = mongoose.model('ben', bemSchema);

export default Bem;
