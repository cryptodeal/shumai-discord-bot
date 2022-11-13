import { CString, FFIType, JSCallback } from 'bun:ffi';
import config from '../files/config.toml';
import { SearchStreamOutput } from '../src/utils/ffi/gen_types/goTwi/filteredStream';
import {
	type GoTwiStreamError,
	isStreamError,
	listSearchStreamRules,
	setAccessToken,
	streamTweets
} from '../src/utils/ffi/twitter';
import { tweetHandler } from '../src/utils/twitterUtils';
let goCallback = genCallback();

function genCallback(): JSCallback {
	return new JSCallback(
		(p, len) => {
			const str = new CString(p, 0, len).toString();
			const json = <SearchStreamOutput | GoTwiStreamError>JSON.parse(str);
			if (isStreamError(json)) {
				console.error(json.message);
				goCallback.close();
				goCallback = genCallback();
				streamTweets(goCallback.ptr);
				return;
			}
			console.log(json);
			tweetHandler(json);
		},
		{
			args: [FFIType.ptr, FFIType.u32]
		}
	);
}

setAccessToken(Buffer.from(`${config.twitter.token}\0`, 'utf8'));
listSearchStreamRules();
streamTweets(goCallback.ptr);
console.log('non-blocking!! :) \n');
