const test = {
	data: {
		edit_history_tweet_ids: ['1589843207227322368'],
		entities: {
			annotations: [
				{ start: 19, end: 24, probability: 0.4391, type: 'Other', normalized_text: 'Clorox' },
				{ start: 28, end: 30, probability: 0.45, type: 'Organization', normalized_text: 'CLX' },
				{ start: 64, end: 66, probability: 0.6229, type: 'Other', normalized_text: 'SPY' }
			],
			cashtags: [
				{ start: 27, end: 31, tag: 'CLX' },
				{ start: 63, end: 67, tag: 'SPY' }
			],
			hashtags: [
				{ start: 46, end: 54, tag: 'options' },
				{ start: 55, end: 62, tag: 'stocks' }
			],
			urls: [
				{
					start: 94,
					end: 117,
					url: 'https://t.co/LAvUlvARE9',
					expanded_url: 'https://beacons.ai/finquant',
					display_url: 'beacons.ai/finquant',
					images: [
						{
							url: 'https://pbs.twimg.com/news_img/1589594610359095297/2GJcTNTX?format=jpg&name=orig',
							width: 96,
							height: 96
						},
						{
							url: 'https://pbs.twimg.com/news_img/1589594610359095297/2GJcTNTX?format=jpg&name=150x150',
							width: 96,
							height: 96
						}
					],
					status: 200,
					title: 'finquant – Bio Links & Creator Profile | Beacons Mobile Website Builder',
					description:
						'@finquant | Market and Risk Analytics Stocks Crypto ETF REIT Options. Check out my links to (Market Insights Newsletter, Twitter, Make your own page like this for free using Beacons).',
					unwound_url: 'https://beacons.ai/finquant'
				},
				{
					start: 118,
					end: 141,
					url: 'https://t.co/MdiWL2cv9C',
					expanded_url: 'https://twitter.com/YDMU_Markets/status/1589843207227322368/photo/1',
					display_url: 'pic.twitter.com/MdiWL2cv9C',
					media_key: '3_1589843206136815617'
				}
			]
		},
		id: '1589843207227322368',
		possibly_sensitive: false,
		text: 'Short Interests of Clorox, $CLX : -4.64% MoM\n\n#options #stocks $SPY \n\nCheck out our tool at: \nhttps://t.co/LAvUlvARE9 https://t.co/MdiWL2cv9C'
	},
	matching_rules: [
		{
			id: '1589842695979163650',
			tag: '(Tensor OR " ML " OR (Machine Learning) OR " AI " OR (Artificial Intelligence)) lang:en -is:retweet'
		}
	]
};
