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
                select: false,
            },
            cargo: {
                type: String,
                required: true,
            },
            status: {
                type: Boolean,
                default: true,
            },
            tokenUnico: { // token único para recuperação de senha
                type: String, 
                select: false 
            }, 
            refreshtoken: { // Refresh token para geração de access token de autenticação longa duração 7 dias para invalidação
                type: String, 
                select: false 
            }, 
            accesstoken: { // Refresh token para  autenticação curta longa 15 minutos para invalidação
                type: String,
                select: false 
            }, 

        }, {
            timestamps: true,
            versionKey: false
        });


        usuarioSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('usuario', usuarioSchema);
    }
}

export default new Usuario().model;