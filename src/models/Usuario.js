import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Usuario{
    constructor() {
        const usuarioSchema = new mongoose.Schema({
            campus: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "campus",
                required: true,
            },
            nome: {
                type: String,
                index: true,
                required: true,
            },
            cpf: {
                type: String,
                required: true,
                unique: true,
            },
            email: {
                type: String,
                required: true,
                unique: true,
            },
            senha: {
                type: String,
                select: false
            },
            cargo: {
                type: String,
                required: true,
            },
            status: {
                type: Boolean,
                default: true,
            }
        }, {
            timestamps: true,
            versionKey: false
        });


        usuarioSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('usuario', usuarioSchema);
    }
}

export default new Usuario().model;