# NorthStar frontend

The frontend is a Next.js App Router application for the NorthStar operations workspace. It currently contains the dashboard and inventory register, with the remaining module routes ready to build out.

## Demo store

The demo uses a small client-side store in `lib/demo-store.tsx`:

- `lib/demo-data.ts` provides the initial mock inventory and demo employees.
- `DemoStoreProvider` loads a saved state from browser `localStorage` after the page hydrates, or starts from the seed data when no saved state exists.
- The stored state includes a schema version, the active demo employee, and inventory items added in the UI.
- The browser key is `northstar.demo-store.v1`. Change the version when the saved shape becomes incompatible; unknown versions start from the current seed data.
- `useDemoStore()` provides access to the active employee and demo inventory to client components.

The demo store is local to one browser profile. It does not synchronize between users or devices and is not an authorization mechanism. The API must enforce real permissions when backend integration begins. The provider is the seam for replacing local demo state with API-backed data while keeping the screens and their domain types.

## Development

```bash
npm install
npm run dev
```

Lint and build:

```bash
npm run lint
npm run build
```
