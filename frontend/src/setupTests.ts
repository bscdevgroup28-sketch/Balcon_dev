// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill crypto.randomUUID for jsdom environment
if (!(global as any).crypto) {
	(global as any).crypto = {} as any;
}
if (!(global as any).crypto.randomUUID) {
	(global as any).crypto.randomUUID = () =>
		Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Some tests rely on axios; use manual mock to avoid ESM interop issues
jest.mock('axios');

// Provide a functional indexedDB stub for modules that reference it on import
if (!(global as any).indexedDB) {
	const mem: Record<string, any> = {};
	(global as any).indexedDB = {
		open: (_name: string, _ver: number) => {
			const req: any = {
				result: {
					objectStoreNames: { contains: () => true },
					transaction: (_s: string, _m: string) => {
						const tx: any = { oncomplete: null, onerror: null };
						const store = {
							put: (v: any) => { mem[v.id] = v; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); },
							delete: (k: string) => { delete mem[k]; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); },
							getAll: () => {
								const r: any = { onsuccess: null, onerror: null };
								setTimeout(() => r.onsuccess && r.onsuccess({ target: { result: Object.values(mem) } }), 0);
								return r;
							}
						};
						return { objectStore: () => store, ...tx };
					},
				},
				onupgradeneeded: null as any,
				onsuccess: null as any,
				onerror: null as any,
			};
			setTimeout(() => req.onsuccess && req.onsuccess({}), 0);
			return req;
		}
	} as any;
}
