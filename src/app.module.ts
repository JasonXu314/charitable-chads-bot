import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DBService } from './db.service';
import { DiscordService } from './discord.service';
import { ScraperModule } from './URTWebScraper/scraper.module';

@Module({
	imports: [ScraperModule],
	controllers: [AppController],
	providers: [DiscordService, DBService]
})
export class AppModule {}

