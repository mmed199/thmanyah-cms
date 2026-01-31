import { registerAs } from '@nestjs/config';

export default registerAs('nats', () => ({
  url: process.env.NATS_URL || 'nats://localhost:4222',
}));
