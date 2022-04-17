import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { AppModule } from './app.module';

config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser());

	app.enableCors({ origin: true });

	await app.listen(process.env.PORT || 3000);
	wakeup();
}

bootstrap();

function wakeup() {
	axios
		.post(`${process.env.BACKEND_URL}/wakeup`)
		.then()
		.catch()
		.finally(() => {
			setTimeout(() => {
				wakeup();
			}, 15 * 60 * 1000);
		});
}

