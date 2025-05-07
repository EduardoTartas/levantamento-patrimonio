import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class LevantamentoModel {
    constructor() {
        const levantamentoSchema = new mongoose.Schema({
            inventario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "inventarios",
                required: true,
            },
            bem: {
                type: mongoose.Schema.Types.ObjectId,
                salaID:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "salas",
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
                    type: String,
                    required: true,
                },
                ocioso: {
                    type: Boolean,
                    default: "false",
                },
                ref: "bens",
                required: true,
            },
            sala: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "salas",
                required: true,
            },
            usuario: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "usuarios",
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
            data: {
                type: Date,
                required: true,
            }
        }, {
            timestamps: true,
            versionKey: false
        });

        levantamentoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('levantamentos', levantamentoSchema);
    }
}