import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Levantamento{
    constructor() {
        const levantamentoSchema = new mongoose.Schema({
            inventario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "inventario",
                required: true,
            },
            bem: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "bem",
                    required: true,
                },
                salaId:{
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
                    required: true,
                    unique: true,
                },
                responsavel: {
                    nome: {
                        type: String,
                        required: true,
                    },
                    cpf: {
                        type: String,
                        required: true,
                    }
                },
                descricao: {
                    type: String,
                    required: true,
                }
            },
            salaNova: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "sala",
            },
            usuario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuario",
                required: true,
            },
            imagem: {
                type: String,
            },
            estado: {
                type: String,
                required: true,
                enum: {
                    values: ["Em condições de uso", "Inservível", "Danificado"]
                }
            },
            ocioso: {
                type: Boolean,
                default: false
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        levantamentoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('levantamento', levantamentoSchema);
    }
}

export default new Levantamento().model;