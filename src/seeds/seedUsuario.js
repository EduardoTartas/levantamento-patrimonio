import { faker } from '@faker-js/faker';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import DbConnect from '../config/DBconfig';
import UsuarioModel from '../models/UsuarioModel';

import getGlobalFakeMapping from './globalFakeMapping';

export function gerarSenhaHash(senha) {
    return bcrypt.hashSync(senha, 10);
}

let senhaPura = "Abc@321";
let senhaHash = gerarSenhaHash(senhaPura);