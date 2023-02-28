/* themeConfigProp */
export interface ThemeConfigProp {
	primary: string;
	isDark: boolean;
}

export interface ChatGPTProp {
	show: boolean;
	keys: string;
	max_tokens: number;
	temperature: number;
	urls: string;
	model: string;
}

/* GlobalState */
export interface GlobalState {
	token: string;
	userInfo: UserInfoState;
	assemblySize: string;
	language: string;
	themeConfig: ThemeConfigProp;
	chatGPT: ChatGPTProp;
}
/* MenuState */
export interface MenuState {
	isCollapse: boolean;
	menuList: Menu.MenuOptions[];
}

/* TabsState */
export interface TabsState {
	tabsMenuValue: string;
	tabsMenuList: Menu.MenuOptions[];
}

/* AuthState */
export interface AuthState {
	authButtons: {
		[propName: string]: any;
	};
	authRouter: string[];
}

/* userInfo */
export interface UserInfoState {
	userName: string;
	userPwd: string;
}

/* bookInfo */
export interface BookInfoState {
	searchInfo: {
		key: string;
		page: number;
		siteid: string;
	};
	bookInfo: any;
}

export interface BookInfoStateParams {
	key: string;
	page: number;
	siteid: string;
}
