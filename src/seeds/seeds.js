import { faker } from '@faker-js/faker';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import DbConnect from '../config/dbConnect';

import Bem          from './models/Bem';
import Campus       from './models/Campus';
import Inventario   from './models/inventario';
import Levantamento from './models/Levantamento';
import Sala         from './models/Sala';
import Usuario      from './models/Usuario';


