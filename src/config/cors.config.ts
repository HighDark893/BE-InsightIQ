import { CorsOptions } from 'cors';

const corsConfig: CorsOptions = {
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-type',
    'Authorization',
    'X-Requested-with',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
  ],
};

export default corsConfig;
