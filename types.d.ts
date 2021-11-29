type Person = {
	id: string;
	name: string;
	workouts: Workout[];
	token: string | null;
};

type Workout =
	| WalkWorkout
	| RunWorkout
	| BikeWorkout
	| SwimWorkout
	| PushupWorkout
	| PullupWorkout
	| SitupWorkout
	| JumpingJacksWorkout
	| MiscIntenseWorkout
	| MiscModerateWorkout;

type WalkWorkout = {
	type: 'WALK';
	distance: number; // in miles
	date: string;
};

type RunWorkout = {
	type: 'RUN';
	distance: number; // in miles
	date: string;
};

type BikeWorkout = {
	type: 'BIKE';
	distance: number; // in miles
	date: string;
};

type SwimWorkout = {
	type: 'SWIM';
	time: number; // in minutes
	date: string;
};

type PushupWorkout = {
	type: 'PUSHUP';
	quantity: number;
	date: string;
};

type PullupWorkout = {
	type: 'PULLUP';
	quantity: number;
	date: string;
};

type SitupWorkout = {
	type: 'SITUP';
	quantity: number;
	date: string;
};

type JumpingJacksWorkout = {
	type: 'JUMPING_JACKS';
	time: number; // in minutes
	date: string;
};

type MiscIntenseWorkout = {
	type: 'MISC_INTENSE';
	time: number; // in minutes
	date: string;
};

type MiscModerateWorkout = {
	type: 'MISC_MODERATE';
	time: number; // in minutes
	date: string;
};
