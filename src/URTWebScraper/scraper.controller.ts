import { Controller, Get } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CrowdfundingNumbers } from './types';

@Controller('/scraper')
export class ScraperController {
	constructor() {}

	@Get('/nums')
	public async getNumbers(): Promise<CrowdfundingNumbers> {
		const browser = await puppeteer.launch({
			headless: true,
			executablePath: '/usr/bin/chromium-browser',
			args: ['--no-sandbox', '--disable-gpu']
		});
		const page = (await browser.pages())[0];
		await page.goto('http://crowdfunding.mst.edu/s/1322/cf19/interior.aspx?sid=1322&gid=38&pgid=3934');

		const goal: string = (await page.$eval('.amt-goal .value', (element) => element.textContent))!;

		const raised: string = (await page.$eval('.amt-progress .value', (element) => element.textContent))!;

		const donors = Number(await page.$eval('.amt-donors .value', (element) => element.textContent));

		const timeRemaining = Number(await page.$eval('.amt-time .time-remaining-value', (element) => element.textContent));

		return {
			goal,
			raised,
			donors,
			timeRemaining
		};
	}
}
