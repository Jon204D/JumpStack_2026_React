# JumpStack_2026_React

For FE projects in the JumpStack July 13th 2026 to July 17th 2026

## Development

```bash
npm install
npm run dev
```

## Testing

The frontend uses Vitest, React Testing Library, and jsdom for unit and component
tests. The initial suite covers API helpers, authentication state and JWT expiry,
login success and failure, and customer money-movement validation and submission.

```bash
npm test
```

During development, run the suite in watch mode:

```bash
npm run test:watch
```

## Frontend planning assets

- `docs/FE_APPLICATION_PLAN.md`: full React TypeScript architecture and MVP scope
- `docs/FIGMA_MOCK_PLAN.md`: Figma-ready screen/component blueprint
- `docs/FIGMA_DESIGN_OPTIONS.md`: three visual design directions for Figma exploration
- `docs/API_CONTRACT_MAP.md`: backend endpoint and payload mapping
- `mocks/bankApp.mock.ts`: typed mock data aligned to backend DTOs
