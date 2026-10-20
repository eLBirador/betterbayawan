# React migration

React + TypeScript in `react-app/` is the primary application. Existing static
pages remain compatibility routes until their content and behavior have been
migrated. Do not delete them merely because React is now the default entry point.

## Route ownership

| Routes | Source |
| --- | --- |
| `/` | `react-app/src/app/page.tsx` |
| `/services` | `react-app/src/app/services/page.tsx` |
| `/services/health` | `react-app/src/app/services/health/page.tsx` |
| Other portal routes | Existing root HTML pages and their scripts |

The production build overlays the complete React export onto the retained portal.
It also replaces `services/index.html` in the output so both `/services` and
`/services/` serve React. Root HTML source files are retained for now, but their
duplicates are not the production source for React-owned routes.

## Development

```sh
npm ci
npm ci --prefix react-app
npm run dev
```

Open `http://localhost:3000`. The development launcher starts Next.js and an
internal compatibility server; unmatched routes reach the existing portal pages.
Starting development from `react-app/` uses the same launcher.

## Production

```sh
npm run build -- --no-bump
npm run preview
```

Preview at `http://localhost:8080`. Deploy `dist/` using the existing hosting
configuration. `build.sh` delegates to the same cross-platform Node build. Omit
`--no-bump` to preserve the previous build-time patch version bump behavior.

Root `assets/` and `data/` remain shared sources. `scripts/prepare-react.mjs`
copies them into React's public directory and generates the complete translation
dictionary before development and builds. The new hero stylesheet is owned by
React at `react-app/public/assets/css/hero.css`.

New page implementations should use React. Before removing a static page, verify
its replacement preserves its content, service links, translation keys, forms,
and interactive tools, then update the production overlay and route checks.
