import { Body, Controller, Delete, Get, Header, Logger, NotFoundException, Param, Patch, Post, Request, Response, UnauthorizedException } from '@nestjs/common';
import { Request as Req, Response as Res } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path/posix';
import { DiscordService } from './discord.service';

@Controller()
export class AppController {
	private readonly logger: Logger;

	constructor(private readonly discord: DiscordService) {
		this.logger = new Logger('Main');
	}

	@Post('/wakeup')
	public wakeup(): void {
		this.logger.log('Received Wakeup');
	}

	@Get('/')
	@Header('Content-Type', 'text/html')
	public getDashboard(@Request() req: Req, @Response({ passthrough: true }) res: Res): string {
		const token = req.cookies.token;

		if (token) {
			const user = this.discord.getUser(token);

			if (!user) {
				res.setHeader('Set-Cookie', 'token=; Expires=Thu, 01-Jan-1970 00:00:01 GMT;');
			} else {
				return `<html>
					<head>
						<link rel="stylesheet" type="text/css" href="styles.css">
						<script src="https://unpkg.com/axios@0.24.0/dist/axios.min.js"></script>
						<title>Exercise Dashboard</title>
					</head>
					<body class="main">
						<ul class="workouts" id="workouts">${user.workouts
							.map((workout, i) => {
								switch (workout.type) {
									case 'WALK':
									case 'RUN':
									case 'BIKE':
										return `
										<li class="workout" id="workout-${i}">
											<div class="workout-left">
												<h4 class="workout-title">${workout.type.slice(0, 1) + workout.type.slice(1).toLowerCase()}</h4>
												<div class="workout-quantity">Distance: ${workout.distance} ${workout.distance === 1 ? 'mile' : 'miles'}</div>
												<div class="workout-date">${workout.date}</div>
											</div>
											<div class="workout-right">
												<button class="button red" id="del-btn-${i}">Delete</button>
												<button class="button blue" id="edit-btn-${i}">Edit</button>
											</div>
										</li>
									`;
									case 'SWIM':
									case 'JUMPING_JACKS':
									case 'MISC_INTENSE':
									case 'MISC_MODERATE':
										return `
										<li class="workout" id="workout-${i}">
											<div class="workout-left">
												<h4 class="workout-title">${workout.type.slice(0, 1) + workout.type.slice(1).toLowerCase().replace('_', ' ')}</h4>
												<div class="workout-quantity">Time: ${workout.time} ${workout.time === 1 ? 'minute' : 'minutes'}</div>
												<div class="workout-date">${workout.date}</div>
											</div>
											<div class="workout-right">
												<button class="button red" id="del-btn-${i}">Delete</button>
												<button class="button blue" id="edit-btn-${i}">Edit</button>
											</div>
										</li>
									`;
									case 'PUSHUP':
									case 'PULLUP':
										return `
										<li class="workout" id="workout-${i}">
											<div class="workout-left">
												<h4 class="workout-title">${workout.type.slice(0, 1) + workout.type.slice(1).toLowerCase()}</h4>
												<div class="workout-quantity">Number: ${workout.quantity}</div>
												<div class="workout-date">${workout.date}</div>
											</div>
											<div class="workout-right">
												<button class="button red" id="del-btn-${i}">Delete</button>
												<button class="button blue" id="edit-btn-${i}">Edit</button>
											</div>
										</li>
									`;
								}
							})
							.join('')}</ul>
						<div class="summary">
							<h4 class="summary-title">Total:</h4>
							<span class="total" id="total">${this.discord.calculateDonation(user)}</span>
						</div>
						<div class="warning" id="warning"></div>

						<script>
							window.workouts = ${JSON.stringify(user.workouts)};
							console.log(workouts);
						</script>
						<script src="app.js"></script>
					</body>
				</html>`;
			}
		}

		return `<html>
				<head>
					<link rel="stylesheet" type="text/css" href="styles.css">
					<script src="https://unpkg.com/axios@0.24.0/dist/axios.min.js"></script>
					<script src="https://cdn.jsdelivr.net/npm/js-cookie@3.0.1/dist/js.cookie.min.js"></script>
					<title>Dashboard Login</title>
				</head>
				<body class="main">
					<div class="input-div">
						<input class="input" id="input" />
						<label class="label" for="input">Username</label>
					</div>
					<button class="button blue" id="btn">Log In</button>
					<div class="warning" id="warning"></div>
	
					<script src="login.js"></script>
				</body>
			</html>`;
	}

	@Patch('/workout')
	public async edit(
		@Request() req: Req,
		@Response({ passthrough: true }) res: Res,
		@Body('idx') idx: number,
		@Body('quantity') quantity: number
	): Promise<{ success: true }> {
		const token = req.cookies.token;

		if (!token) {
			throw new UnauthorizedException('No token');
		} else {
			try {
				return await this.discord.editExercise(token, idx, quantity);
			} catch (err: unknown) {
				if (err instanceof NotFoundException) {
					throw err;
				} else {
					res.setHeader('Set-Cookie', 'token=; Expires=Thu, 01-Jan-1970 00:00:01 GMT;');
					throw new UnauthorizedException('Token does not correspond to a user');
				}
			}
		}
	}

	@Delete('/workout')
	public async delete(@Request() req: Req, @Response({ passthrough: true }) res: Res, @Body('idx') idx: number): Promise<{ success: true }> {
		const token = req.cookies.token;

		if (!token) {
			throw new UnauthorizedException('No token');
		} else {
			try {
				return await this.discord.deleteExercise(token, idx);
			} catch (err: unknown) {
				if (err instanceof NotFoundException) {
					throw err;
				} else {
					res.setHeader('Set-Cookie', 'token=; Expires=Thu, 01-Jan-1970 00:00:01 GMT;');
					throw new UnauthorizedException('Token does not correspond to a user');
				}
			}
		}
	}

	@Post('/login')
	public async login(@Body('username') username: string): Promise<{ token: string }> {
		return this.discord.login(username);
	}

	@Get('/styles.css')
	@Header('Content-Type', 'text/css')
	public css(): string {
		return readFileSync(join(__dirname, 'public', 'styles.css')).toString();
	}

	@Get('/:file')
	public file(@Param('file') file: string): string {
		if (!existsSync(join(__dirname, 'public', file))) {
			throw new NotFoundException('File does not exist');
		}

		return readFileSync(join(__dirname, 'public', file)).toString();
	}
}
