import { CString, JSCallback } from 'bun:ffi';
import config from '../files/config.toml';
import { execSearchStream, listSearchStreamRules, setAccessToken } from '../src/utils/ffi/twitter';

const data: any[] = [];
const goCallback = new JSCallback(
	(ptr: number) => {
    console.log(ptr)
		const string = new CString(ptr);
		const json = JSON.parse(string.toString());
		console.log(json);
	},
	{
		args: ['ptr']
	}
);

setAccessToken(Buffer.from(`${config.twitter.token}\0`, 'utf8'));
console.log(listSearchStreamRules());
console.log(execSearchStream(goCallback));
