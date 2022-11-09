import { CString, FFIType, JSCallback, ptr } from 'bun:ffi';
import config from '../files/config.toml';
import { execSearchStream, listSearchStreamRules, setAccessToken } from '../src/utils/ffi/twitter';

const data: any[] = [];

const stream = () => <Promise<string>>new Promise((resolve) => {
		const goCallback = new JSCallback(
			(p, len) => {
				console.log('ptr:', p, 'len:', len);
				const str = new CString(p, 0, len).toString();
				// logs the stringifed JSON object correctly
				console.log(str);
				return ptr(Buffer.from(str + '\0', 'utf8'));
			},
			{
				args: [FFIType.ptr, FFIType.u32],
				returns: FFIType.cstring
			}
		);
		const res = execSearchStream(goCallback);
		console.log(res);
		console.log(res.toString());
		resolve(JSON.parse(res.toString()));
	});
setAccessToken(Buffer.from(`${config.twitter.token}\0`, 'utf8'));
console.log(listSearchStreamRules());
const out = await stream();
console.log(out);
