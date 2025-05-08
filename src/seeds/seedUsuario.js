import { faker } from '@faker-js/faker';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import DbConnect from '../config/dbConnect';
import UsuarioModel from '../models/Usuario';

import getGlobalFakeMapping from './globalFakeMapping';
