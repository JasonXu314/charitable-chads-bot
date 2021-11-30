import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client, Guild, Intents, Message, TextChannel } from 'discord.js';
import { nanoid } from 'nanoid';
import { DBService } from './db.service';

@Injectable()
export class DiscordService {
	private readonly client: Client;
	private readonly logger: Logger;

	private readonly users: Person[] = [];
	private reportingChannel: TextChannel | null = null;
	private statusMessage: Message | null = null;
	private guild: Guild | null = null;

	constructor(private readonly db: DBService) {
		this.client = new Client({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
				Intents.FLAGS.DIRECT_MESSAGES
			]
		});
		this.logger = new Logger('Discord');

		this.client.on('ready', async () => {
			this.logger.log('ready');
			const guilds = await this.client.guilds.fetch();
			this.guild = await guilds.get('897180434318889082')!.fetch();
			await this.guild.members.fetch();
			this.reportingChannel = (await this.guild.channels.fetch('902044689664983091')) as TextChannel;
			this.statusMessage = (await this.reportingChannel.messages.fetchPinned()).get('902056588213362730')!;
			const chadsRole = (await this.guild.roles.fetch('897670792668655686'))!;
			const members = [...chadsRole.members.values()];

			await Promise.all(
				members.map(async (member) => {
					const user = await this.db.getUser(member.id);

					if (!user) {
						const newUser: Person = { id: member.id, name: member.displayName, workouts: [], token: null };
						await this.db.addUser(newUser);
						this.users.push(newUser);
					} else {
						if (member.displayName !== user.name) {
							user.name = member.displayName;
							await this.db.renameUser(member.id, member.displayName);
						}
						this.users.push(user);
					}
				})
			);

			await this.updateScoreboard();

			const now = new Date();
			const nextMonth = new Date(now.getFullYear(), (now.getMonth() + 1) % 12, 1);

			setTimeout(() => this.reset(), nextMonth.valueOf() - now.valueOf());
		});

		this.client.on('guildMemberUpdate', async (oldMember, newMember) => {
			if (this.users.find((user) => user.id === newMember.id)) {
				if (oldMember.displayName !== newMember.displayName) {
					await this.db.renameUser(newMember.id, newMember.displayName);
					await this.updateScoreboard();
				}
			} else if (newMember.roles.cache.get('897670792668655686')) {
				const newUser: Person = { id: newMember.id, name: newMember.displayName, workouts: [], token: null };
				await this.db.addUser(newUser);
				this.users.push(newUser);
			}
		});

		this.client.on('messageCreate', async (msg) => {
			if (msg.channel.id === '902044689664983091' && msg.content.startsWith('+')) {
				const [quantityStr, exercise] = msg.content.slice(1).split(' ');
				const authorId = msg.author.id;
				const quantity = Number(quantityStr);

				if (Number.isNaN(quantity)) {
					msg.reply('ur a fucking retard');
					return;
				}

				switch (exercise) {
					case 'walk':
					case 'run':
					case 'bike': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = {
								type: exercise.toUpperCase() as Uppercase<typeof exercise>,
								distance: quantity,
								date: new Date().toLocaleDateString()
							};
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'swim': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'SWIM', time: quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'pushups': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'PUSHUP', quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'pullups': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'PULLUP', quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'situps': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'SITUP', quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'jumpingjacks': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'JUMPING_JACKS', time: quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'intense': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'MISC_INTENSE', time: quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					case 'moderate': {
						const user = this.users.find((user) => user.id === authorId);

						if (user) {
							const newWorkout: Workout = { type: 'MISC_MODERATE', time: quantity, date: new Date().toLocaleDateString() };
							user.workouts.push(newWorkout);
							await this.db.addWorkout(authorId, newWorkout);
							await msg.react('✅');
							await this.updateScoreboard();
						}
						break;
					}
					default:
						msg.reply('Invalid workout type');
				}
			} else if (/^<@!?901965277183488070>/.test(msg.content) && /\s?help\s?/g.test(msg.content)) {
				msg.reply(
					'Usage:\n<@901965277183488070> help to print this message\n<@901965277183488070> dashboard to get the dashboard link\n+<quantity> <exercise> to log exercises\nQuantity for walking (walk), running (run), and biking (bike) is distance in miles\nQuantity for swimming (swim), miscellaneous (intense/moderate), and jumping jacks (jumpingjacks) is time in minutes'
				);
			} else if (/^<@!?901965277183488070>/.test(msg.content) && /\s?dashboard\s?/g.test(msg.content)) {
				msg.reply('https://charitable-chads-bot.herokuapp.com');
			}
		});

		this.client
			.login(process.env.DISCORD_TOKEN!)
			.then(() => {
				this.logger.log('logged in');
			})
			.catch((err) => {
				this.logger.error('login failed', err);
			});
	}

	public calculateDonation(user: Person): string {
		let total = 0;

		for (const workout of user.workouts) {
			switch (workout.type) {
				case 'WALK':
					total += 0.25 * workout.distance;
					break;
				case 'RUN':
					total += 0.5 * workout.distance;
					break;
				case 'BIKE':
					total += 0.1 * workout.distance;
					break;
				case 'SWIM':
					total += (0.5 * workout.time) / 30;
					break;
				case 'PUSHUP':
					total += 0.01 * workout.quantity;
					break;
				case 'PULLUP':
					total += 0.02 * workout.quantity;
					break;
				case 'SITUP':
					total += 0.005 * workout.quantity;
					break;
				case 'JUMPING_JACKS':
					total += 0.05 * workout.time;
					break;
				case 'MISC_INTENSE':
					total += (0.75 * workout.time) / 30;
					break;
				case 'MISC_MODERATE':
					total += (0.4 * workout.time) / 30;
					break;
			}
		}

		return `$${total.toFixed(2)}`;
	}

	public async login(name: string): Promise<{ token: string }> {
		const user = this.users.find((user) => user.name === name);

		if (!user) {
			throw new BadRequestException('No user with that username');
		} else {
			const discordUser = await this.client.users.fetch(user.id);
			discordUser.send(
				'Someone has requested to log in with your username. Reply with "Yes" to authorize the login, or "No" to decline. You have 30 seconds.'
			);

			return new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new BadRequestException('Time expired for authentication'));
					this.client.off('messageCreate', listener);
				}, 30_000);

				const listener = (msg: Message) => {
					if (msg.author.id === discordUser.id && msg.channelId === discordUser.dmChannel?.id) {
						if (msg.content.toLowerCase() === 'yes') {
							const token = nanoid();

							user.token = token;
							this.db.setToken(discordUser.id, token).then(() => {
								clearTimeout(timeout);
								resolve({ token });
								this.client.off('messageCreate', listener);
							});
						} else if (msg.content.toLowerCase() === 'no') {
							reject(new BadRequestException('Login declined'));
							this.client.off('messageCreate', listener);
						}
					}
				};

				this.client.on('messageCreate', listener);
			});
		}
	}

	public async editExercise(token: string, idx: number, quantity: number): Promise<{ success: true }> {
		const user = this.users.find((user) => user.token === token);

		if (!user) {
			throw new Error('Token not found');
		} else {
			try {
				await this.db.editWorkout(user.id, idx, quantity);
				const workout = user.workouts[idx];

				if ('distance' in workout) {
					workout.distance = quantity;
				} else if ('time' in workout) {
					workout.time = quantity;
				} else if ('quantity' in workout) {
					workout.quantity = quantity;
				}
				await this.updateScoreboard();

				return { success: true };
			} catch (err: unknown) {
				throw new NotFoundException((err as Error).message);
			}
		}
	}

	public async deleteExercise(token: string, idx: number): Promise<{ success: true }> {
		const user = this.users.find((user) => user.token === token);

		if (!user) {
			throw new Error('Token not found');
		} else {
			try {
				await this.db.deleteWorkout(user.id, idx);
				user.workouts.splice(idx, 1);
				await this.updateScoreboard();

				return { success: true };
			} catch (err: unknown) {
				throw new NotFoundException((err as Error).message);
			}
		}
	}

	public getUser(token: string): Person | null {
		return this.users.find((user) => user.token === token) || null;
	}

	public async updateScoreboard(): Promise<void> {
		if (this.statusMessage) {
			await this.statusMessage.edit(this.users.map((user) => `${user.name}: ${this.calculateDonation(user)}`).join('\n'));
		} else {
			this.logger.log('Status Message null when attempting to update scoreboard');
		}
	}

	public reset(): void {
		this.db.dbReset().then(() => {
			const now = new Date();
			const nextMonth = new Date(now.getFullYear(), (now.getMonth() + 1) % 12, 1);

			setTimeout(() => this.reset(), nextMonth.valueOf() - now.valueOf());
		});
	}
}
