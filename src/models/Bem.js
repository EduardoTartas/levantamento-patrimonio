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
    // O responsável agora é um objeto
    responsavel: {
        nome: { 
            type: String, 
            required: true 
        },
        cpf: { 
            type: String, 
            required: true,
            index: true // Adicionar um índice ao CPF pode ser útil para buscas
        }
    },
    // ----------------------
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
    ocioso: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    versionKey: false
});

bemSchema.plugin(mongoosePaginate);

const Bem = mongoose.model('ben', bemSchema);

export default Bem;
