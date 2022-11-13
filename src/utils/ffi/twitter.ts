import { type JSCallback, dlopen, FFIType, ptr } from 'bun:ffi';
import { TweetField } from './gen_types/goTwi/fields';
import { SearchStreamInput } from './gen_types/goTwi/filteredStream';

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
		args: [FFIType.cstring, 'function']
	}
});

export type GoTwiStreamError = {
	error: boolean;
	message: string;
};

export const isStreamError = (obj: unknown): obj is GoTwiStreamError => {
	return typeof obj === 'object' && obj !== null && 'error' in obj && 'message' in obj;
};

export const streamTweets = (
	callback: JSCallback | JSCallback.ptr,
	params: SearchStreamInput = {
		BackfillMinutes: 0,
		TweetFields: [
			TweetField.TweetFieldID,
			TweetField.TweetFieldAuthorID,
			TweetField.TweetFieldText,
			TweetField.TweetFieldCreatedAt,
			TweetField.TweetFieldEntities,
			TweetField.TweetFieldPossiblySensitive,
			TweetField.TweetFieldLang
		],
		Expansions: [],
		MediaFields: [],
		PlaceFields: [],
		PollFields: [],
		UserFields: []
	}
) => {
	execSearchStream.native(ptr(Buffer.from(JSON.stringify(params) + '\0', 'utf8')), callback);
};
