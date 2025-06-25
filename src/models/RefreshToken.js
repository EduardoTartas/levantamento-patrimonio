import mongoose from "mongoose";

class RefreshToken {
  constructor() {
    const refreshTokenSchema = new mongoose.Schema({
      token: {
        type: String,
        required: true,
        unique: true,
        select: false // para não retornar por padrão
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuario",
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7
      }
    }, {
      timestamps: true,
      versionKey: false,
    });

    this.model = mongoose.model('refreshToken', refreshTokenSchema);
  }
}

export default new RefreshToken().model;
