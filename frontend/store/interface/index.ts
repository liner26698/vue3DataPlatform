/* themeConfigProp */
export interface ThemeConfigProp {
	primary: string;
	isDark: boolean;
}

export interface ChatGPTProp {
	show: boolean;
	authorization: string;
	contentType: string;
	urls: string;
	name: string;
	key: string;
	model: string;
}

export interface HeaderTabProp {
	label: string;
	value: string;
}
/* GlobalState */
export interface GlobalState {
	token: string;
	userInfo: UserInfoState;
	assemblySize: string;
	language: string;
	themeConfig: ThemeConfigProp;
	chatGPT: ChatGPTProp;
	headerTabList: HeaderTabProp[];
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
	classificationList: any[];
	leftTabLabel: string;
	headerCurrentLabel: string;
	tabTypeList: any[];
}

export interface BookInfoStateParams {
	key: string;
	page: number;
	siteid: string;
}
