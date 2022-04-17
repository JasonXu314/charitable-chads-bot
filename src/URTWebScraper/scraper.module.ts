import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';

@Module({
	imports: [],
	controllers: [ScraperController],
	providers: [ScraperService]
})
export class ScraperModule {}
