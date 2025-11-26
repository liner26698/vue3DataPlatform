import { PersistOptions } from "pinia-plugin-persist";

// pinia持久化参数配置
const piniaPersistConfig = (key: string) => {
	const persist: PersistOptions = {
		enabled: true,
		strategies: [
			{
				key,
				// 改为 localStorage 以实现登录状态持久化
				storage: localStorage
			}
		]
	};
	return persist;
};

export default piniaPersistConfig;
