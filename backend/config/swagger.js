const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tournament Management System API',
      version: '1.0.0',
      description: 'Enterprise Tournament Management System REST API',
      contact: { name: 'API Support', email: 'support@tournamentsystem.com' },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development Server' },
      { url: 'https://api.tournamentsystem.com/api', description: 'Production Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

module.exports = swaggerJsdoc(options);
