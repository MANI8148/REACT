const Joi = require('joi');

// Validation schemas
const schemas = {
    register: Joi.object({
        username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required()
            .messages({
                'string.alphanum': 'Username must only contain alphanumeric characters',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 30 characters',
                'any.required': 'Username is required'
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'Password is required'
            })
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    transaction: Joi.object({
        type: Joi.string().valid('buy', 'sell', 'send', 'receive').required(),
        assetId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        totalValue: Joi.number().min(0).required(),
        symbol: Joi.string().required(),
        name: Joi.string().required(),
        image: Joi.string().uri().allow(''),
        recipientAddress: Joi.when('type', {
            is: 'send',
            then: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
            otherwise: Joi.optional()
        })
    }),

    setupPin: Joi.object({
        pin: Joi.string()
            .length(4)
            .pattern(/^\d{4}$/)
            .required()
            .messages({
                'string.length': 'PIN must be exactly 4 digits',
                'string.pattern.base': 'PIN must contain only numbers',
                'any.required': 'PIN is required'
            })
    }),

    verifyPin: Joi.object({
        pin: Joi.string().length(4).pattern(/^\d{4}$/).required()
    }),

    verify2FA: Joi.object({
        token: Joi.string().length(6).pattern(/^\d{6}$/).required()
    }),

    transfer: Joi.object({
        assetId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        direction: Joi.string().valid('hot-to-cold', 'cold-to-hot').required()
    })
};

// Validation middleware factory
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return res.status(500).json({ error: 'Validation schema not found' });
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        req.validatedBody = value;
        next();
    };
};

module.exports = { validate, schemas };
