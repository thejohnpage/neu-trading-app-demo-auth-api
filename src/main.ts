import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NEU Trading Authentication API')
    .setDescription('NestJS authentication, JWT validation, refresh sessions, and logout for the Fidelity LEAP capstone.')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    useGlobalPrefix: false,
    swaggerOptions: { persistAuthorization: false },
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
