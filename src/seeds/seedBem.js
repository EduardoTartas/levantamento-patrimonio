import { faker } from '@faker-js/faker';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import DbConnect from '../config/dbConnect';
import CampusModel from '../models/Campus';

import getGlobalFakeMapping from './globalFakeMapping';

await DbConnect.conectar();