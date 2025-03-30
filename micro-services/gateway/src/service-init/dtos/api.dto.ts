import Joi from 'joi';
import { ApiKeyCreationAttributes } from '../models/main/apikey.model';

const create = {
  body: Joi.object<ApiKeyCreationAttributes>().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    expiresAt: Joi.date().optional().min('now'),
    isActive: Joi.boolean().default(true).optional(),
  }),
};

const update = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
  body: Joi.object<Partial<ApiKeyCreationAttributes>>().keys({
    name: Joi.string().optional(),
    description: Joi.string().optional().allow(null),
    expiresAt: Joi.date().optional().min('now').allow(null),
    isActive: Joi.boolean().optional(),
  }),
};

const getOne = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const readAll = {};

const remove = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

const regenerate = {
  params: Joi.object().keys({
    id: Joi.number().required(),
  }),
};

export default {
  create,
  update,
  getOne,
  readAll,
  remove,
  regenerate,
};
