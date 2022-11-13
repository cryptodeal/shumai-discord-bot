import config from '../files/config.toml';
import { AddingRules } from '../src/utils/ffi/gen_types/goTwi/filteredStream';
import { TwitterClient } from '../src/utils/twitter';
import { tweetHandler } from '../src/utils/twitterUtils';

const client = new TwitterClient({ token: config.twitter.token });

// Edit rules as desired below
const rules: AddingRules = [
	{
		value:
			'shumai OR (url_title:shumai OR url_description:shumai OR url_contains:shumai) lang:en -is:retweet'
	},
	{
		value: 'url:"https://github.com/facebookresearch/shumai" -is:retweet'
	},
	{
		value:
			'(Tensor OR #ML OR "Machine Learning" OR #AI OR "Artificial Intelligence") (Javascript OR #JS OR Typescript OR #TS) lang:en -is:retweet'
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
