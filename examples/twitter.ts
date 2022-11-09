import { CString, FFIType, JSCallback } from 'bun:ffi';
import config from '../files/config.toml';
import { execSearchStream, listSearchStreamRules, setAccessToken } from '../src/utils/ffi/twitter';

const data: any[] = [];

const stream = () => <Promise<number>>new Promise((resolve) => {
		const goCallback = new JSCallback((ptr) => ptr, {
			args: ['ptr'],
			returns: FFIType.ptr,
			threadsafe: true
		});
		resolve(execSearchStream(goCallback));
	});
setAccessToken(Buffer.from(`${config.twitter.token}\0`, 'utf8'));
console.log(listSearchStreamRules());
const out = await stream();
console.log(new CString(out).toString());
