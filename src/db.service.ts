import { Injectable, Logger } from '@nestjs/common';
import { InsertOneResult, ModifyResult, MongoClient } from 'mongodb';

@Injectable()
export class DBService {
	private client: MongoClient | null = null;
	private clientPromise: Promise<MongoClient> | null = null;
	private readonly logger: Logger;

	constructor() {
		this.logger = new Logger('DB');
		this.clientPromise = this.connect();
	}

	public async addUser(user: Person): Promise<InsertOneResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const result = await users.insertOne(user).catch((err) => {
			console.error(err);
		});

		return result || this.addUser(user);
	}

	public async renameUser(id: string, name: string): Promise<ModifyResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const user = await this.getUser(id);

		if (!user) {
			throw new Error('User does not exist');
		}

		user.name = name;

		const result = await users.findOneAndReplace({ id }, user).catch((err) => {
			console.error(err);
		});

		return result || this.renameUser(id, name);
	}

	public async getUser(id: string): Promise<Person | null> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const result = await users.findOne({ id }).catch((err) => {
			console.error(err);
		});

		if (!result && result === null) {
			return result;
		}

		return result || this.getUser(id);
	}

	public async addWorkout(id: string, workout: Workout): Promise<ModifyResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const user = await this.getUser(id);

		if (!user) {
			throw new Error('User does not exist');
		}

		user.workouts.push(workout);

		const result = await users.findOneAndReplace({ id }, user).catch((err) => {
			console.error(err);
		});

		return result || this.addWorkout(id, workout);
	}

	public async editWorkout(id: string, idx: number, quantity: number): Promise<ModifyResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const user = await this.getUser(id);

		if (!user) {
			throw new Error('User does not exist');
		}
		if (user.workouts.length <= idx) {
			throw new Error('Workout does not exist');
		}

		const workout = user.workouts[idx];

		if ('distance' in workout) {
			workout.distance = quantity;
		} else if ('time' in workout) {
			workout.time = quantity;
		} else if ('quantity' in workout) {
			workout.quantity = quantity;
		}

		const result = await users.findOneAndReplace({ id }, user).catch((err) => {
			console.error(err);
		});

		return result || this.editWorkout(id, idx, quantity);
	}

	public async deleteWorkout(id: string, idx: number): Promise<ModifyResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const user = await this.getUser(id);

		if (!user) {
			throw new Error('User does not exist');
		}
		if (user.workouts.length <= idx) {
			throw new Error('Workout does not exist');
		}

		user.workouts.splice(idx, 1);

		const result = await users.findOneAndReplace({ id }, user).catch((err) => {
			console.error(err);
		});

		return result || this.deleteWorkout(id, idx);
	}

	public async setToken(id: string, token: string): Promise<ModifyResult<Person>> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const user = await this.getUser(id);

		if (!user) {
			throw new Error('User does not exist');
		}

		user.token = token;

		const result = await users.findOneAndReplace({ id }, user).catch((err) => {
			console.error(err);
		});

		return result || this.setToken(id, token);
	}

	public async getUsers(): Promise<Person[]> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const currUsers = await users
			.find()
			.toArray()
			.catch((err) => {
				console.error(err);
			});

		return currUsers || this.getUsers();
	}

	public async dbReset(): Promise<void> {
		const client = await this.connect();
		const users = client.db('main').collection<Person>('exercises');

		const currUsers = await this.getUsers();

		currUsers.forEach((user) => (user.workouts = []));

		const res = await Promise.all(currUsers.map((user) => users.findOneAndReplace({ id: user.id }, user))).catch((err) => {
			console.error(err);
		});

		if (!res) {
			this.dbReset();
		}
	}

	private async connect(): Promise<MongoClient> {
		if (this.client) {
			return this.client;
		} else if (this.clientPromise) {
			return this.clientPromise;
		} else {
			const client = await MongoClient.connect(process.env.MONGODB_URL!).catch((err) => {
				console.error(err);
			});

			if (client) {
				this.logger.log('Successfully Connected');
				this.client = client;
			}

			return client || this.connect();
		}
	}
}
