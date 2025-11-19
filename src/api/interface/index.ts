// * 请求响应参数(不包含data)
export interface Result {
	code: string;
	msg: string;
}

// * 请求响应参数(包含data)
export interface ResultData<T = any> extends Result {
	data?: T;
	total: number;
}

// * 分页响应参数
export interface ResPage<T> {
	datalist: T[];
	pageNum: number;
	pageSize: number;
	total: number;
}

// * 分页请求参数
export interface ReqPage {
	pageNum: number;
	pageSize: number;
}

// * 登录
export namespace Login {
	export interface ReqLoginForm {
		username: string;
		password: string;
		// rememberPassword: boolean;
	}
	export interface ResLogin {
		access_token: string;
		test: string;
	}
	export interface ResAuthButtons {
		[propName: string]: any;
	}
}

// * 用户管理
export namespace User {
	export interface ReqGetUserParams extends ReqPage {
		username: string;
		gender: number;
		idCard: string;
		email: string;
		address: string;
		createTime: string[];
		status: number;
	}
	export interface ResUserList {
		id: string;
		username: string;
		gender: string;
		age: number;
		idCard: string;
		email: string;
		address: string;
		createTime: string;
		status: number;
		avatar: string;
		children?: ResUserList[];
	}
}

// * 日志管理
export namespace Logs {
	export interface ReqGetLogsParams extends ReqPage {
		username: string;
		operation: string;
		createTime: string[];
		lines?: number;
	}
	export interface ResLogsList {
		id: string;
		username: string;
		operation: string;
		ip: string;
		createTime: string;
	}
}
