import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors();

  // API prefix
  app.setGlobalPrefix("api");

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Thmanyah Content Platform")
    .setDescription("API for managing podcasts, documentaries, and other content")
    .setVersion("1.0")
    .addTag("Programs", "Program management endpoints")
    .addTag("Contents", "Content management endpoints")
    .addTag("Ingestion", "Content ingestion from external sources")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port") || 3000;

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
  console.log(`🎮 GraphQL Playground at: http://localhost:${port}/graphql`);
}
bootstrap();
