import config from '../files/config.toml';
import { StreamRules, TwitterClient } from '../src/utils/twitter';

const client = new TwitterClient({ token: config.twitter.token });

// Edit rules as desired below
const rules: StreamRules = [
	{
		value: '(shumai) lang:en -is:retweet',
		tag: 'name'
	},
	{
		value: '(bun OR bun.sh) lang:en -is:retweet',
		tag: 'bun mention'
	},
	{
		value: 'Tensor lang:en -is:retweet',
		tag: 'bun mention'
	}
];

let current_rules;

current_rules = await client.getStreamRules();
console.log('Current Rules:', current_rules)
await client.deleteStreamRules(current_rules);
current_rules = null
console.log('Deleted Rules:', current_rules)
current_rules = await client.addStreamRules(rules);
console.log('Added Rules:', current_rules)

const data = client.searchStream();
for await (const dat of data) {
	console.log(dat);
}
