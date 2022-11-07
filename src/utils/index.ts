import { RequestOptions } from 'http';
import { fetchIssues, fetchPullRequests } from './githubUtils';

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
	return <Promise<T>>fetch(path, opts)
		.then((res) => res.json())
		.catch(() => console.error('ERROR -- METHOD: ' + opts?.method, 'path: ' + path));
}

export const fetchApi = {
	get: <T>(path: string, config?: RequestInit): Promise<T> => {
		let headers: HeadersInit = {};
		if (config?.headers) {
			headers = { ...headers, ...config.headers };
			delete config.headers;
		}
		const init = { method: 'GET', headers, ...config };
		return http<T>(path, init);
	},

	post: <T, U>(path: string, body: T, config?: RequestInit): Promise<U> => {
		let headers: HeadersInit = {
			'Content-Type': 'application/json'
		};
		if (config?.headers) {
			headers = { ...headers, ...config.headers };
			delete config.headers;
		}
		const init = {
			method: 'POST',
			body: JSON.stringify(body),
			headers,
			...config
		};
		return http<U>(path, init);
	}
};

export const refreshGitData = async () => {
	await fetchIssues();
	await fetchPullRequests();
};
