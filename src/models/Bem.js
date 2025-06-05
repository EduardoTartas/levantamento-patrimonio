import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Bem{
    constructor() {
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
            },            tombo: {
                type: String,
                required: false,
                unique: function() { return this.tombo && this.tombo.trim() !== ''; }, // Apenas aplica unique se o tombo não for vazio
                sparse: true // Permite múltiplos documentos com campo vazio
            },
            responsavel: {
                type: String,
                required: true,
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
            ocioso: {
                type: Boolean,
                default: false,
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        bemSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('ben', bemSchema);
    }
}

export default new Bem().model;