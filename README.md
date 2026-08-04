# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Environments

| Environment | Host             | URL                                    | Deploy command        |
| ----------- | ---------------- | -------------------------------------- | --------------------- |
| Production  | Netlify          | https://anyway-reports.netlify.app     | `npm run deploy:prod` |
| Staging     | Firebase Hosting | https://anyway-reports-staging.web.app | `npm run deploy:stg`  |

Both deploys are manual and can be run from any branch. Netlify also builds
`main` automatically through its Git integration, so pushing to `main` ships
production too.

### One-time setup

Each deploy target needs its CLI authenticated once per machine:

```bash
npx firebase login              # staging
npx netlify login && npx netlify link   # production, link to the existing Netlify site
```

### Tracking tags

`index.html` carries four third-party tracking tags (Chartbeat, Meta Pixel and
the Natoon Leshinuy and ynet Google Analytics properties), wrapped in
`<!-- tracking:start -->` / `<!-- tracking:end -->` markers.

A Vite plugin in `vite.config.ts` deletes that block and injects
`<meta name="robots" content="noindex, nofollow" />` for every build whose mode
is not `production`. So:

- `npm run build` (production, what Netlify runs) ships the tags
- `npm run build:stg` and `npm run dev` do not

This keeps developer and stakeholder traffic out of ynet's analytics and keeps
the staging URL out of search results. The equally.ai accessibility widget is
outside the markers and ships everywhere.

Design notes: `docs/superpowers/specs/2026-08-04-firebase-staging-design.md`

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
