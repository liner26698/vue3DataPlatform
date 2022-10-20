// tailwind.config.js
module.exports = {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	// darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {
			colors: {
				mainbg: "#1f1d2b",
				bgicon: "#353340",
				bgf8: "#f8fafc"
			}
		},
		textColor: {
			hui80: "#808191",
			fff: "#fff",
			c75: "#757575",
			c50: "#50a1ff",
			c3c: "#3c4248"
		}
	},
	variants: {
		extend: {}
	},
	plugins: []
};
