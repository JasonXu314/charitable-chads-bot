const button = document.getElementById('btn');
const input = document.getElementById('input');
const warning = document.getElementById('warning');

button.addEventListener('click', () => {
	axios
		.post('/login', { username: input.value }, { timeout: 30_000 })
		.then((res) => {
			Cookies.set('token', res.data.token, { sameSite: 'strict' });
			location.reload();
		})
		.catch((err) => {
			alert(err);
			warning.textContent = err.toString();
		});
	warning.textContent = '';
});

input.addEventListener('change', () => {
	if (input.value && !input.classList.contains('contentful')) {
		input.classList.add('contentful');
	} else if (!input.value && input.classList.contains('contentful')) {
		input.classList.remove('contentful');
	}
});
