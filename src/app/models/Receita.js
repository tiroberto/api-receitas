import { Schema, model } from 'mongoose';
import * as Yup from 'yup';



const ReceitaSchema = new Schema({
    foto: String,
    descricao: String,
    ingredientes: [{ quantidade: String, descricao: String }],
    modoPreparo: [{ passoNumero: Number, descricao: String }],
    tempoPreparo: String,
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    toJSON: {
        virtuals: true
    }
});

export const validarReceita = async (objeto) => {
    const schema = Yup.object().shape({
        descricao: Yup.string().required(),
        ingredientes: Yup.array()
            .of(
                Yup.object().shape({
                    quantidade: Yup.string().required(),
                    descricao: Yup.string().required()
                })
            )
            .required(),
        modoPreparo: Yup.array()
            .of(
                Yup.object().shape({
                    passoNumero: Yup.number().required(),
                    descricao: Yup.string().required()
                })
            )
            .required(),
        tempoPreparo: Yup.string().required()
    });

    
    return await schema.isValid(objeto);
}

ReceitaSchema.virtual('foto_url').get(function () {
    return `http://localhost:3333/files/${this.foto}`;
});

export default model('Receita', ReceitaSchema);