const warning = document.getElementById('warning');
let delListeners = null;
let editListeners = null;

function makeListItem(workout, idx) {
	const li = document.createElement('li');
	li.className = 'workout';
	li.id = `workout-${idx}`;

	const left = document.createElement('div');
	left.className = 'workout-left';
	const h4 = document.createElement('h4');
	h4.className = 'workout-title';
	h4.textContent = workout.type.slice(0, 1) + workout.type.slice(1).toLowerCase();
	const div = document.createElement('div');
	div.className = 'workout-quantity';
	div.textContent = `Distance: ${workout.distance} ${workout.distance === 1 ? 'mile' : 'miles'}`;
	const date = document.createElement('div');
	date.className = 'workout-date';
	date.textContent = workout.date;

	left.appendChild(h4);
	left.appendChild(div);
	left.appendChild(date);

	const right = document.createElement('div');
	right.className = 'workout-right';
	const delBtn = document.createElement('button');
	delBtn.className = 'button red';
	delBtn.id = `del-btn-${idx}`;
	delBtn.textContent = 'Delete';
	const editBtn = document.createElement('button');
	editBtn.className = 'button blue';
	delBtn.id = `edit-btn-${idx}`;
	editBtn.textContent = 'Edit';

	right.appendChild(delBtn);
	right.appendChild(editBtn);

	li.appendChild(left);
	li.appendChild(right);

	return li;
}

function calculateDonation(workouts) {
	let total = 0;

	for (const workout of workouts) {
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

function attachListeners() {
	delListeners = [];
	editListeners = [];

	workouts.forEach((workout, idx) => {
		const delBtn = document.getElementById(`del-btn-${idx}`);
		const editBtn = document.getElementById(`edit-btn-${idx}`);

		const delListener = () => {
			axios
				.delete('/workout', { data: { idx } })
				.then(() => {
					attachListeners();
				})
				.catch((err) => {
					console.error(err);
					warning.textContent = err.toString();

					workouts = [...workouts.slice(0, idx), workout, ...workouts.slice(idx + 1)];

					const elem = makeListItem(workout, idx);
					const list = document.getElementById('workouts');
					let currElems = Array.from(list.childNodes);

					currElems = [...currElems.slice(0, idx), elem, ...currElems.slice(idx + 1)];

					list.replaceChildren(...currElems);
					document.getElementById('total').textContent = calculateDonation(workouts);

					attachListeners();
				});
			cleanupListeners();

			workouts.slice(idx + 1).forEach((_, i) => {
				document.getElementById(`del-btn-${idx + i + 1}`).id = `del-btn-${idx + i}`;
				document.getElementById(`workout-${idx + i + 1}`).id = `workout-${idx + i}`;
			});
			workouts.splice(idx, 1);
			document.getElementById(`workout-${idx}`).remove();
			document.getElementById('total').textContent = calculateDonation(workouts);
			warning.textContent = '';
		};

		const editListener = () => {
			const oldVal = workout.distance || workout.time || workout.quantity;

			const workoutElem = document.getElementById(`workout-${idx}`);
			const currRow = workoutElem.querySelector('div.workout-quantity');
			const newRow = document.createElement('div');
			newRow.textContent = 'distance' in workout ? 'Distance: ' : 'time' in workout ? 'Time: ' : 'Number: ';

			const input = document.createElement('input');
			input.className = 'subtle-input';
			input.value = oldVal;

			input.addEventListener('keyup', () => {
				if (Number.isNaN(Number(input.value))) {
					input.value = workout.distance || workout.time || workout.quantity;
				} else {
					if ('distance' in workout) {
						workout.distance = Number(input.value);
					} else if ('time' in workout) {
						workout.time = Number(input.value);
					} else {
						workout.quantity = Number(input.value);
					}
					document.getElementById('total').textContent = calculateDonation(workouts);
				}
			});

			newRow.appendChild(input);
			newRow.appendChild(document.createTextNode('distance' in workout ? ' miles' : 'time' in workout ? ' minutes' : ''));

			const saveBtn = document.createElement('button');
			saveBtn.className = 'button green';
			saveBtn.textContent = 'Save';
			const cancelBtn = document.createElement('button');
			cancelBtn.className = 'button red';
			cancelBtn.textContent = 'Cancel';

			const saveListener = () => {
				const div = document.createElement('div');
				div.className = 'workout-quantity';
				div.textContent =
					('distance' in workout ? 'Distance: ' : 'time' in workout ? 'Time: ' : 'Number: ') +
					input.value +
					('distance' in workout ? ' miles' : 'time' in workout ? ' minutes' : '');

				axios
					.patch('/workout', { idx, quantity: input.value })
					.then(() => {
						saveBtn.remove();
						attachListeners();
					})
					.catch((err) => {
						console.error(err);
						warning.textContent = err.toString();

						if ('distance' in workout) {
							workout.distance = oldVal;
						} else if ('time' in workout) {
							workout.time = oldVal;
						} else {
							workout.quantity = oldVal;
						}

						div.textContent =
							('distance' in workout ? 'Distance: ' : 'time' in workout ? 'Time: ' : 'Number: ') +
							oldVal +
							('distance' in workout ? ' miles' : 'time' in workout ? ' minutes' : '');
						document.getElementById('total').textContent = calculateDonation(workouts);

						attachListeners();
					});

				cancelBtn.remove();
				newRow.replaceWith(div);
				saveBtn.textContent = 'Saving...';
				saveBtn.disabled = true;
				saveBtn.removeEventListener('click', saveListener);
			};

			const cancelListener = () => {
				const div = document.createElement('div');
				div.className = 'workout-quantity';
				div.textContent =
					('distance' in workout ? 'Distance: ' : 'time' in workout ? 'Time: ' : 'Number: ') +
					oldVal +
					('distance' in workout ? ' miles' : 'time' in workout ? ' minutes' : '');

				newRow.replaceWith(div);
				saveBtn.remove();
				cancelBtn.remove();

				attachListeners();
			};

			saveBtn.addEventListener('click', saveListener);
			cancelBtn.addEventListener('click', cancelListener);
			cleanupListeners();

			currRow.replaceWith(newRow);
			workoutElem.querySelector('div.workout-right').appendChild(cancelBtn);
			workoutElem.querySelector('div.workout-right').appendChild(saveBtn);
		};

		delBtn.addEventListener('click', delListener);
		editBtn.addEventListener('click', editListener);
		delBtn.disabled = false;
		editBtn.disabled = false;
		delListeners.push(delListener);
		editListeners.push(editListener);
		warning.textContent = '';
	});
}

function cleanupListeners() {
	workouts.forEach((_, i) => {
		const delBtn = document.getElementById(`del-btn-${i}`);
		delBtn.disabled = true;
		delBtn.removeEventListener('click', delListeners[i]);

		const editBtn = document.getElementById(`edit-btn-${i}`);
		editBtn.disabled = true;
		editBtn.removeEventListener('click', editListeners[i]);
	});
	delListeners = null;
	editListeners = null;
}

attachListeners();
