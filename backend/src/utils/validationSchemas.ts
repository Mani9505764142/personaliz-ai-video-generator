import Joi from 'joi';

export const userValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),
};

export const videoValidation = {
  createVideo: Joi.object({
    prompt: Joi.string().min(10).max(1000).required(),
    metadata: Joi.object().optional(),
  }),

  updateVideo: Joi.object({
    prompt: Joi.string().min(10).max(1000).optional(),
    metadata: Joi.object().optional(),
  }),
};

export const whatsappValidation = {
  sendMessage: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    message: Joi.string().min(1).max(1000).required(),
    messageType: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO').optional(),
  }),

  sendVideo: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    videoUrl: Joi.string().uri().required(),
    caption: Joi.string().max(1000).optional(),
  }),
};
