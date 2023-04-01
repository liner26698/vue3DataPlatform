import { createI18n } from "vue-i18n";
import zh from "./modules/zh";
import en from "./modules/en";

const i18n = createI18n({
	legacy: false, // you must set `false`, to use Composition API
	locale: "zh", // set locale
	messages: {
		// set locale messages
		zh,
		en
	}
});

export default i18n;
