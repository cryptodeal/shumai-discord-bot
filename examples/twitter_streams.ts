import config from '../files/config.toml';
import { StreamRules, TwitterClient } from '../src/utils/twitter';
import { tweetHandler } from '../src/utils/twitterUtils';

const client = new TwitterClient({ token: config.twitter.token });

// Edit rules as desired below
const rules: StreamRules = [
	{
		value:
			'(shumai OR (url:"https://github.com/facebookresearch/shumai" OR url_title:shumai OR url_description:shumai OR url_contains:shumai)) lang:en -is:retweet'
	},
	{
		value:
			'(Tensor OR " ML " OR (Machine Learning) OR " AI " OR (Artificial Intelligence)) lang:en -is:retweet'
	},
	{
		value: '(bun OR bun.sh OR oven.sh) lang:en -is:retweet'
	}
];

let current_rules;

current_rules = await client.getStreamRules();
console.log('Current Rules:', current_rules);
await client.deleteStreamRules(current_rules);
current_rules = null;
console.log('Deleted Rules:', current_rules);
current_rules = await client.addStreamRules(rules);
console.log('Added Rules:', current_rules);

const data = client.searchStream();
for await (const dat of data) {
	tweetHandler(dat);
}
