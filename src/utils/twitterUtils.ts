import type { SearchStreamOutput } from './ffi/gen_types/goTwi/filteredStream';
import { db } from './githubUtils';
import { Logger } from './Logger';

interface ITweet {
	id: number;
	// is_shumai_mention tracks expected result of NLP model
	is_shumai_mention: boolean;
	// body of the tweet
	text: string;
	// unique tweet ID
	tweet_id: string;
	// stringified TweetEditIds
	edit_history_tweet_ids: string;
	// stores stringified TweetAnnotations
	annotations: string | null;
	// stores stringified TweetHashtags
	hashtags: string | null;
	// stringified TweetMentions
	mentions: string | null;
	// stringified TweetUrls
	urls: string | null;
	// flagged as possibly sensitive material (TODO: cast to boolean in wrapper; e.g.`+ true` or `Number(tr))
	possibly_sensitive: boolean;
	// stringified TweetMatchedRules (tracks the query/queries string(s) that matched the tweet)
	matched_rules: string;
}

// db.exec('DROP TABLE IF EXISTS tweets');
db.exec(
	'CREATE TABLE IF NOT EXISTS tweets (id INTEGER PRIMARY KEY, is_shumai_mention TINYINT, text TEXT, tweet_id TEXT, edit_history_tweet_ids TEXT, annotations TEXT, hashtags TEXT, mentions TEXT, urls TEXT, possibly_sensitive TINYINT, matched_rules TEXT)'
);

const addToDb = db.prepare(
	'INSERT INTO tweets (is_shumai_mention, text, tweet_id, edit_history_tweet_ids, annotations, hashtags, mentions, urls, possibly_sensitive, matched_rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const testPrevEdit = db.prepare('SELECT * FROM tweets WHERE edit_history_tweet_ids = ?');
const testRecordExists = db.prepare('SELECT * FROM tweets WHERE id = ?');

const recordFromArray = <T>(arr: T[]): Record<number, T> => {
	const res: Record<number, T> = {};
	const len = arr.length;
	for (let i = 0; i < len; i++) {
		res[i] = arr[i];
	}
	return res;
};

const stringifiedRecord = (arr: any[]): string => JSON.stringify(recordFromArray(arr));

let count = 0;
export const tweetHandler = (tweet: SearchStreamOutput) => {
	const {
		data: { edit_history_tweet_ids, id, possibly_sensitive, entities, text },
		matching_rules
	} = tweet;

	const is_shumai_mention =
		matching_rules.findIndex(
			(v) => v.tag === 'url:"https://github.com/facebookresearch/shumai" -is:retweet'
		) !== -1
			? true
			: false;

	if (testRecordExists.get(id)) {
		const { annotations, hashtags, mentions, urls } = entities;

		db.exec(
			`UPDATE tweets SET is_shumai_mention = '${is_shumai_mention}', text = '${text}', annotations = '${
				annotations ? stringifiedRecord(annotations) : null
			}', hashtags = '${hashtags ? stringifiedRecord(hashtags) : null}', mentions = '${
				mentions ? stringifiedRecord(mentions) : null
			}', urls = '${
				urls ? stringifiedRecord(urls) : null
			}', possibly_sensitive = '${possibly_sensitive}', matched_rules = '${stringifiedRecord(
				matching_rules
			)}' WHERE tweet_id = ${id} AND edit_history_tweet_ids = '${stringifiedRecord(
				edit_history_tweet_ids
			)}'`
		);
		count++;
		return;
	}
	// tweet is edited, delete old record
	if (edit_history_tweet_ids.length) {
		// tweet has edit history, delete prev record
		const old_record_match = stringifiedRecord(edit_history_tweet_ids.filter((i) => i !== id));
		if (testPrevEdit.get(old_record_match)) {
			db.exec(`DELETE FROM tweets WHERE edit_history_tweet_ids = ${old_record_match}`);
			Logger.debug(
				`Deleted old record for tweet WHERE edit_history_tweet_ids = ${old_record_match}`
			);
			// decrement count as we remove old record
			count--;
		}
	}

	const { annotations, hashtags, mentions, urls } = entities;
	addToDb.run(
		is_shumai_mention,
		text,
		id,
		stringifiedRecord(edit_history_tweet_ids),
		annotations ? stringifiedRecord(annotations) : null,
		hashtags ? stringifiedRecord(hashtags) : null,
		mentions ? stringifiedRecord(mentions) : null,
		urls ? stringifiedRecord(urls) : null,
		possibly_sensitive,
		stringifiedRecord(matching_rules)
	);
	// increment count as we add new record
	Logger.debug(`Added record to 'tweets' where tweet_id = ${id}; tweet count: ${++count}`);
};
