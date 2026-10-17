// Development-only clock and viewport harness. Production builds ignore all QA parameters.
const params = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
const requested=params?.get('qa-time');
const origin=requested && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(requested) ? new Date(requested).getTime() : NaN;
const started=Date.now();
export function currentDate() { return Number.isFinite(origin)?new Date(origin+Date.now()-started):new Date(); }
const width=Number(params?.get('qa-width'));
export const previewWidth = import.meta.env.DEV && width>=320 && width<=1400 ? width : undefined;
