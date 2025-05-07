import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

class Inventario{
    constructor() {
        const inventarioSchema = new mongoose.Schema({
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
            data: {
                type: Date,
                required: true,
            },
            status: {
                type: Boolean,
                default: "false",
            },
        }, {
            timestamps: true,
            versionKey: false
        });

        inventarioSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('inventario', inventarioSchema);
    }
}

export default new Inventario().model;