import { fetchApi } from '.';
import {
	AddingRules,
	CreateRulesOutput,
	ListRulesOutput,
	SearchStreamOutput
} from './ffi/gen_types/goTwi/filteredStream';

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
	'https://api.twitter.com/2/tweets/search/stream?tweet.fields=edit_history_tweet_ids,entities,id,lang,possibly_sensitive,text';

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

	public addStreamRules(rules: AddingRules) {
		return fetchApi.post(
			rulesURL,
			{ add: rules.map(({ value }) => ({ value, tag: value })) },
			{
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${this.bearer_token}`
				}
			}
		);
	}

	public deleteStreamRules(rules: ListRulesOutput | CreateRulesOutput) {
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

	public searchStream = (): AsyncGenerator<SearchStreamOutput> => this.stream<SearchStreamOutput>();
}
