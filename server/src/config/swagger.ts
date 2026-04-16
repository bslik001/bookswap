import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookSwap API',
      version: '1.0.0',
      description: 'API REST pour l\'application d\'echange de livres scolaires BookSwap',
    },
    servers: [
      { url: '/api', description: 'API BookSwap' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        Meta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            gradeInterests: { type: 'array', items: { type: 'string' } },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPPLIER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            author: { type: 'string' },
            grade: { type: 'string' },
            className: { type: 'string' },
            condition: { type: 'string', enum: ['NEW', 'USED'] },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            status: { type: 'string', enum: ['AVAILABLE', 'RESERVED', 'EXCHANGED'] },
            owner: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string', description: 'Tronque: "D."' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
  },
  apis: ['./src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
