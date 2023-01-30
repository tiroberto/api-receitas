import * as Yup from 'yup';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import Receita, { validarReceita } from '../models/Receita';
import Usuario from '../models/Usuario';

class ReceitaController {
    async cadastro(req, res) {
        const { filename } = req.file;
        const { descricao, ingredientes, modoPreparo, tempoPreparo } = req.body;
        const { usuario_id } = req.headers;

        if (ingredientes && modoPreparo) {
            const ingredientesJSON = JSON.parse(ingredientes);
            const modoPreparoJSON = JSON.parse(modoPreparo);

            const receitaValidar = {
                descricao,
                ingredientes: ingredientesJSON,
                modoPreparo: modoPreparoJSON,
                tempoPreparo
            };

            if (!(await validarReceita(receitaValidar)))
                return res.status(400).json({ error: 'Falha na validação' });

            const receita = await Receita.create({
                foto: filename,
                descricao,
                ingredientes: ingredientesJSON,
                modoPreparo: modoPreparoJSON,
                tempoPreparo,
                usuario: usuario_id
            });

            return res.json(receita);
        }

        return res.json({ error: 'Falha nos dados' });
    }

    async buscarReceita(req, res) {
        const { receita_id } = req.query;

        if (!mongoose.isValidObjectId(receita_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });

        const receita = await Receita.findById(receita_id);

        return res.json(receita);
    }

    async buscarReceitasPorUsuario(req, res) {
        const { usuario_id } = req.headers;

        if (!mongoose.isValidObjectId(usuario_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });

        const receitas = await Receita.find({ usuario: usuario_id });

        return res.json(receitas);
    }

    async atualizarReceita(req, res) {
        const schema = Yup.object().shape({
            descricao: Yup.string(),
            ingredientes: Yup.array()
                .of(
                    Yup.object().shape({
                        quantidade: Yup.string().required(),
                        descricao: Yup.string().required()
                    })
                ),
            modoPreparo: Yup.array()
                .of(
                    Yup.object().shape({
                        passoNumero: Yup.number().required(),
                        descricao: Yup.string().required()
                    })
                ),
            tempoPreparo: Yup.string()
        });
        if (!(await schema.isValid(req.body)) || !(req.file))
            return res.status(400).json({ error: 'Falha na validação' });

        const { filename } = req.file;
        const { receita_id } = req.params;
        const { descricao, ingredientes, modoPreparo, tempoPreparo } = req.body;
        const { usuario_id } = req.headers;


        //verificcando se foi enviado o id da receita ou usuario
        if (!mongoose.isValidObjectId(receita_id) || !mongoose.isValidObjectId(usuario_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });


        const receita = await Receita.findById(receita_id);
        const usuario = await Usuario.findById(usuario_id);

        //verificando se está autorizado a atualizar a receita
        if (String(usuario._id) !== String(receita.usuario))
            return res.status(401).json({ error: 'Não autorizado' });


        receita.descricao = descricao;
        if (ingredientes)
            receita.ingredientes = JSON.parse(ingredientes);
        if (modoPreparo)
            receita.modoPreparo = JSON.parse(modoPreparo);
        receita.tempoPreparo = tempoPreparo;
        receita.foto = filename;
        await receita.save();

        return res.json(receita);
    }

    async deletarReceita(req, res) {
        const { receita_id } = req.query;
        const { usuario_id } = req.headers;

        if (!mongoose.isValidObjectId(usuario_id) || !mongoose.isValidObjectId(receita_id))
            return res.status(400).json({ error: 'Chave de cadastro inválida' });

        const receita = await Receita.findById(receita_id);

        if (!receita)
          return res.status(400).json({ error: 'Já foi excluído' });

        //verificando se está autorizado a excluir a receita
        if (String(usuario_id) !== String(receita.usuario))
            return res.status(401).json({ error: 'Não autorizado' });


        await Receita.findByIdAndDelete({ _id: receita_id });

        let file = path.resolve(__dirname, '..', '..', '..', 'uploads', receita.foto);
        fs.access(file, fs.constants.F_OK, (err) => {
            fs.unlink(file, function (err) {
                if (err) console.log(err);
                else console.log('file deleted successfully');
            });
        });



        return res.json({ message: 'Excluído' });
    }
}

export default new ReceitaController();
