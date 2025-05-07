import { faker } from '@faker-js/faker';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import DbConnect from '../config/DBconfig';
import CampusModel from '../models/CampusModel';

import getGlobalFakeMapping from './globalFakeMapping';

await DbConnect.conectar();
