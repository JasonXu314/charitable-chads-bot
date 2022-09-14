import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { CrowdfundingNumbers } from './types';

@Injectable()
export class ScraperService {
	private readonly browser: Promise<puppeteer.Browser>;
	private numbers: Promise<CrowdfundingNumbers>;
	private fetching: boolean;

	constructor() {
		this.fetching = false;
		this.browser = puppeteer.launch({
			executablePath: '/usr/bin/google-chrome',
			headless: true,
			args: ['--no-sandbox', '--disable-gpu']
		});
		this.numbers = this.fetch();
	}

	private async fetch(): Promise<CrowdfundingNumbers> {
		if (this.fetching) {
			return this.numbers;
		}

		this.fetching = true;

		const browser = await this.browser,
			page = (await browser.pages())[0];

		await page.goto('http://crowdfunding.mst.edu/s/1322/cf19/interior.aspx?sid=1322&gid=38&pgid=3934');

		const goal: string = (await page.$eval('.amt-goal .value', (element) => element.textContent))!;
		const raised: string = (await page.$eval('.amt-progress .value', (element) => element.textContent))!;
		const donors = Number(await page.$eval('.amt-donors .value', (element) => element.textContent));
		const timeRemaining = Number(await page.$eval('.amt-time .time-remaining-value', (element) => element.textContent));

		this.fetching = false;

		return {
			goal,
			raised,
			donors,
			timeRemaining
		};
	}

	public async refetch(): Promise<void> {
		this.numbers = this.fetch();
	}

	public async getNumbers(): Promise<CrowdfundingNumbers> {
		const cachedNums = this.numbers;
		this.refetch();
		return cachedNums;
	}
}
