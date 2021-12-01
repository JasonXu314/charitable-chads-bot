const sass = require('sass');
const fs = require('fs');

fs.mkdirSync('dist/public');

fs.readdirSync('public').map((file) => {
	if (file.endsWith('scss')) {
		fs.writeFileSync(`dist/public/${file.split('.').slice(0, -1).join('.')}.css`, sass.renderSync({ file: `public/${file}` }).css);
	} else {
		fs.copyFileSync(`public/${file}`, `dist/public/${file}`);
	}
});
