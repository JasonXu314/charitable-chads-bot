import { Controller, Get } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { CrowdfundingNumbers } from './types';

@Controller('/scraper')
export class ScraperController {
	constructor(private readonly scraperService: ScraperService) {}

	@Get('/nums')
	public async getNumbers(): Promise<CrowdfundingNumbers> {
		return this.scraperService.getNumbers();
	}
}
