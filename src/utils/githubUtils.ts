import { Database } from 'bun:sqlite';
import { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';
import MiniSearch from 'minisearch';
import config from '../../files/config.toml';
import utilities from '../../files/utilities.toml';
import { Logger } from './Logger';
import { githubTitleClean } from './regexes';

export type IssueState = 'open' | 'closed' | 'all' | 'merged';
export type IssueType = '(IS)' | '(PR)' | '(IS|PR)';
interface Issue {
	id: number;
	repository: string;
	title: string;
	number: number;
	state: IssueState;
	created_at: string;
	closed_at: string | null;
	html_url: string;
	user_login: string;
	user_html_url: string;
	type: IssueType;
}

interface PullRequest extends Issue {
	merged_at: string | null;
	draft: boolean;
}

export const db = new Database('./files/database.sqlite');
await db.exec('DROP TABLE IF EXISTS issuesandprs');
await db.exec(
	'CREATE TABLE issuesandprs (id INTEGER PRIMARY KEY, repository TEXT, title TEXT, number INTEGER, state TEXT, created_at TEXT, closed_at TEXT, merged_at TEXT, html_url TEXT, user_login TEXT, user_html_url TEXT, type TEXT, draft TINYINT)'
);

const addToDb = db.prepare(
	'INSERT INTO issuesandprs (repository, title, number, state, created_at, closed_at, merged_at, html_url, user_login, user_html_url, type, draft) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

export let issues = 0;
export let pulls = 0;

export const fetchIssues = async () => {
	for await (const repository of utilities.github.repositories) {
		let page = 1;

		while (true) {
			const res = (await (
				await fetch(
					`https://api.github.com/repos/${repository}/issues?per_page=100&page=${page}&state=all`,
					{
						headers: {
							'Content-Type': 'application/json',
							'User-Agent': 'bun-discord-bot',
							Authorization: `token ${config.api.github_personal_access_token}`
						}
					}
				)
			).json()) as any;

			for (const issue of res) {
				if ('pull_request' in issue) continue;

				// @ts-expect-error it works
				await addToDb.run([
					issue.repository_url.replace('https://api.github.com/repos/', ''),
					issue.title,
					issue.number,
					issue.state,
					issue.created_at,
					issue.closed_at,
					null,
					issue.html_url,
					issue.user.login,
					issue.user.html_url,
					'(IS)',
					null
				]);
				issues++;
			}

			Logger.debug(`Fetching issues for ${repository} - ${issues} * ${page}`);

			page++;
			if (res.length === 0) {
				break;
			}
		}

		Logger.success(`Issues have been fetched for ${repository} - ${issues}`);
	}

	issues = null;
	Object.freeze(issues);
};

export const fetchPullRequests = async () => {
	for await (const repository of utilities.github.repositories) {
		let page = 1;

		while (true) {
			const res = (await (
				await fetch(
					`https://api.github.com/repos/${repository}/pulls?per_page=100&page=${page}&state=all`,
					{
						headers: {
							'Content-Type': 'application/json',
							'User-Agent': 'bun-discord-bot',
							Authorization: `token ${config.api.github_personal_access_token}`
						}
					}
				)
			).json()) as any;

			for (const pull of res) {
				// @ts-expect-error it works
				await addToDb.run([
					pull.html_url.replace('https://github.com/', '').replace(`/pull/${pull.number}`, ''),
					pull.title,
					pull.number,
					pull.state,
					pull.created_at,
					pull.closed_at,
					pull.merged_at,
					pull.html_url,
					pull.user.login,
					pull.user.html_url,
					'(PR)',
					pull.draft
				]);
				pulls++;
			}

			Logger.debug(`Fetching pull requests for ${repository} - ${pulls} * ${page}`);

			page++;
			if (res.length === 0) {
				break;
			}
		}

		Logger.success(`Pull requests have been fetched for ${repository} - ${pulls}`);
	}

	pulls = null;
	Object.freeze(pulls);
};

export const setIssue = async (issue: Issue) => {
	const exists = await db
		.prepare(`SELECT * FROM issuesandprs WHERE number = ? AND repository = ?`)
		.get(issue.number, issue.repository);
	if (exists) {
		db.exec(
			`UPDATE issuesandprs SET state = '${issue.state}', closed_at = '${issue.closed_at}', title = '${issue.title}' WHERE number = ${issue.number} AND repository = '${issue.repository}'`
		);
	} else {
		/**
		 * works, but should probably type correctly
		 *
		 * @ts-expect-error */
		addToDb.run([
			issue.repository,
			issue.title,
			issue.number,
			issue.state,
			issue.created_at,
			issue.closed_at,
			null,
			issue.html_url,
			issue.user_login,
			issue.user_html_url,
			'(IS)',
			null
		]);
	}
};

export const setPullRequest = async (pull: PullRequest) => {
	const exists = await db
		.prepare(`SELECT * FROM issuesandprs WHERE number = ? AND repository = ?`)
		.get(pull.number, pull.repository);
	if (exists) {
		db.exec(
			`UPDATE issuesandprs SET state = '${pull.state}', closed_at = '${pull.closed_at}', merged_at = '${pull.merged_at}', title = '${pull.title}' WHERE number = ${pull.number} AND repository = '${pull.repository}'`
		);
	} else {
		/**
		 * works, but should probably type correctly
		 *
		 * @ts-expect-error */
		addToDb.run([
			pull.repository,
			pull.title,
			pull.number,
			pull.state,
			pull.created_at,
			pull.closed_at,
			pull.merged_at,
			pull.html_url,
			pull.user_login,
			pull.user_html_url,
			'(IS)',
			pull.draft
		]);
	}
};

export const deleteIssueOrPR = (number: number, repository: string) => {
	db.exec(`DELETE FROM issuesandprs WHERE repository = '${repository}' AND number = ${number}`);
};

export const search = async (
	query: string,
	repository: string,
	state: IssueState,
	type: IssueType
): Promise<APIApplicationCommandOptionChoice[]> => {
	try {
		const sqliteTypePrepase = type !== '(IS|PR)' ? ` AND type = '${type}'` : '';
		const arrayFiltered =
			state === 'all'
				? await db
						.prepare(`SELECT * FROM issuesandprs WHERE repository = ?${sqliteTypePrepase}`)
						.all(repository)
				: state === 'merged'
				? await db
						.prepare(
							`SELECT * FROM issuesandprs WHERE merged_at IS NOT NULL AND repository = ?${sqliteTypePrepase}`
						)
						.all(repository)
				: await db
						.prepare(
							`SELECT * FROM issuesandprs WHERE repository = ? AND state = ?${sqliteTypePrepase}`
						)
						.all(repository, state);

		if (!query) {
			const array = arrayFiltered.slice(0, 25);
			return array.map(
				(issueOrPr: Issue | PullRequest) =>
					new Object({
						name: `${issueOrPr.type.slice(0, -1)} #${issueOrPr.number}) ${formatEmojiStatus(
							issueOrPr
						)} ${issueOrPr.title
							.slice(0, 91 - issueOrPr.id.toString().length)
							.replace(githubTitleClean, '')}`,
						value: issueOrPr.number.toString()
					})
			) as APIApplicationCommandOptionChoice[];
		}

		const searcher = new MiniSearch({
			fields: query.startsWith('#') ? ['number'] : ['title'],
			storeFields: ['title', 'number', 'type', 'state', 'merged_at', 'draft'],
			searchOptions: {
				fuzzy: 3,
				processTerm: (term) => term.toLowerCase()
			}
		});

		searcher.addAll(arrayFiltered);

		const result = searcher.search(query);

		return (result as unknown as Issue[] | PullRequest[]).slice(0, 25).map(
			(issueOrPr: Issue | PullRequest) =>
				new Object({
					name: `${issueOrPr.type.slice(0, -1)} #${issueOrPr.number}) ${formatEmojiStatus(
						issueOrPr
					)} ${issueOrPr.title
						.slice(0, 91 - issueOrPr.id.toString().length)
						.replace(githubTitleClean, '')}`,
					value: issueOrPr.number.toString()
				})
		) as APIApplicationCommandOptionChoice[];
	} catch (e) {
		return [];
	}
};

export const getIssueOrPR = async (
	number: number,
	repository: string,
	state: IssueState,
	type: IssueType
): Promise<Issue | PullRequest> => {
	const sqliteTypePrepase = type !== '(IS|PR)' ? ` AND type = '${type}'` : '';
	const issueOrPR =
		state === 'all'
			? await db
					.prepare(
						`SELECT * FROM issuesandprs WHERE repository = ? AND number = ?${sqliteTypePrepase}`
					)
					.get(repository, number)
			: state === 'merged'
			? await db
					.prepare(
						`SELECT * FROM issuesandprs WHERE repository = ? AND number = ? AND merged_at IS NOT NULL${sqliteTypePrepase}`
					)
					.get(repository, number)
			: await db
					.prepare(
						`SELECT * FROM issuesandprs WHERE repository = ? AND number = ? AND state = ?${sqliteTypePrepase}`
					)
					.get(repository, number, state);

	return issueOrPR;
};

export const formatStatus = (data: Issue | PullRequest) => {
	let operation = '';
	let timestamp = '';
	switch (data.state as 'open' | 'closed' | 'all') {
		case 'open':
			operation = 'opened';
			timestamp = `<t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:R>`;
			break;
		case 'closed':
			operation = (data as PullRequest).merged_at ? 'merged' : 'closed';
			timestamp = (data as PullRequest).merged_at
				? `<t:${Math.floor(new Date((data as PullRequest).merged_at).getTime() / 1000)}:R>`
				: `<t:${Math.floor(new Date(data.closed_at).getTime() / 1000)}:R>`;
			break;
	}

	return `${operation} ${timestamp}`;
};

export const formatEmojiStatus = (data: Issue | PullRequest) => {
	let emoji = '';
	switch (data.state as 'open' | 'closed' | 'all') {
		case 'open':
			emoji = (data as PullRequest).draft ? '⚫' : '🟢';
			break;
		case 'closed':
			emoji = (data as PullRequest).merged_at ? '🟣' : '🔴';
			break;
	}

	return emoji;
};
