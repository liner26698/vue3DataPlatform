import { Login } from "@/api/interface/index";
// import { PORT1 } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 登录模块
 */
// * 用户登录接口
export const loginApi = (params: Login.ReqLoginForm) => {
	return http.post<Login.ResLogin>(`/login`, params);
	// return http.post<Login.ResLogin>(PORT1 + `/login`, params);
};
export const testToken = (params: any) => {
	return http.post(`/testToken`, params);
};

// * 获取按钮权限
export const getAuthButtons = () => {
	// return http.get<Login.ResAuthButtons>(PORT1 + `/auth/buttons`);
	return http.get<Login.ResAuthButtons>(`/auth/buttons`);
};

// * 获取菜单列表
export const getMenuList = () => {
	// return http.get<Menu.MenuOptions[]>(PORT1 + `/menu/list`);
	return http.get<Menu.MenuOptions[]>(`/menu/getMenuList`);
};
