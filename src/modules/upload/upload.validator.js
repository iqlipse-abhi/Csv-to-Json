const Joi = require('joi');

const headerSchema = Joi.array().items(Joi.string().required());

module.exports = { headerSchema };
