import { dlopen, FFIType } from 'bun:ffi';

export const tweets: any[] = [];

export const {
	symbols: {
		setAccessToken,
		listSearchStreamRules,
		execSearchStream,
		deleteSearchStreamRule,
		addSearchStreamRule
	}
} = dlopen(import.meta.dir + '/goTwi.dylib', {
	setAccessToken: {
		args: [FFIType.cstring]
	},
	listSearchStreamRules: {
		returns: FFIType.cstring
	},
	addSearchStreamRule: {
		args: [FFIType.cstring],
		returns: FFIType.cstring
	},
	deleteSearchStreamRule: {
		args: [FFIType.i64]
	},
	execSearchStream: {
		args: ['function']
	}
});
