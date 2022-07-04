// * global
declare global {
	interface Navigator {
		msSaveOrOpenBlob: (blob: Blob, fileName: string) => void;
		browserLanguage: string;
	}
}

// 和风天气插件
declare interface Window {
	WIDGET: any;
}

export {};
