import config from '../../files/config.toml';
import { fetchApi } from '.';
import type { searchStream } from './twitter_oapi_types';
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream';

// https://stackoverflow.com/a/50375286
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I
) => void
	? I
	: never;

export type GetContent<T> = 'content' extends keyof T
	? ResponseType extends keyof T['content']
		? T['content'][ResponseType]
		: never
	: never;

export type SuccessStatus = 200 | 201;

export type GetSuccess<T> = {
	[K in SuccessStatus & keyof T]: GetContent<T[K]>;
}[SuccessStatus & keyof T];

export type TwitterResponse<T> = UnionToIntersection<ExtractTwitterResponse<T>>;

export type ExtractTwitterResponse<T> = 'responses' extends keyof T
	? GetSuccess<T['responses']>
	: never;

export type StreamRule = { [key: string]: string } & { value: string; tag: string };
export type StreamRules = StreamRule[];

export class TwitterClient {
	private bearer_token: string;
	private public_key: string;
	private id: string;
	private decoder: TextDecoder;

	public current_rules: any;

	constructor(opts: { token: string; public_key?: string; id?: string }) {
		this.decoder = new TextDecoder('utf-8');
		const { token, public_key, id } = opts;
		this.bearer_token = token;
		this.public_key = public_key;
		this.id = id;
	}

	public getStreamRules() {
		return fetchApi.get(rulesURL, {
			headers: {
				authorization: `Bearer ${this.bearer_token}`
			}
		});
	}

	public addStreamRules(rules: StreamRules) {
		return fetchApi.post(
			rulesURL,
			{ add: rules },
			{
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${this.bearer_token}`
				}
			}
		);
	}

	public deleteStreamRules(rules) {
		if (!Array.isArray(rules.data)) {
			return null;
		}
		const ids = rules.data.map((rule) => rule.id);
		return fetchApi.post(
			rulesURL,
			{ delete: { ids } },
			{
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${this.bearer_token}`
				}
			}
		);
	}
  private async *stream<T>(): AsyncGenerator<T> {
		const { stdout, kill } = Bun.spawn([
			'curl',
			streamURL,
			'-H',
			`Authorization: Bearer ${this.bearer_token}`
		]);
		if (typeof stdout === 'number') throw new Error('stdout is not a stream');
		let buf = '';
		try {
			for await (const bytes of stdout) {
				const chunk = this.decoder.decode(bytes);
				buf += chunk;
				const lines = buf.split('\r\n');
				for (const [i, line] of lines.entries()) {
					if (i === lines.length - 1) {
						buf = line;
					} else if (line) yield JSON.parse(line);
				}
			}
		} finally {
			kill();
		}
	}

	public searchStream = ():AsyncGenerator<TwitterResponse<searchStream>> => this.stream<TwitterResponse<searchStream>>();
}
