// The data files (Slides/data/**/*.json) as URLs of the built site, by their path in
// data/ ("sample-asset.json", "reports/lab-dev-01.json"): Vite copies the files into
// the build (the small ones become data: URLs). Used by DataFile.vue (the preview).
const urls = import.meta.glob('../../../data/**/*.json', { query: '?url', import: 'default', eager: true })

export const dataFiles = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [path.replace(/^.*?\/data\//, ''), url])
)
