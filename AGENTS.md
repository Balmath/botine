# Project Development Guidelines

This document provides essential information for AI agents working on the **Botine** project.

---

## 1. Project Overview

**Botine** is a TypeScript-based project with the following core dependencies and tools:

### Core Stack

- **Language**: TypeScript
- **Package Manager**: npm
- **Runtime**: Node.js (check package.json for version requirements)
- **Testing**: Vitest
- **Formatting**: oxfmt
- **Linting**: oxlint

### Development Tools

- **Runtime for TSX**: tsx (can be used with watch mode)
- **Type Checker**: TypeScript (`tsc`)
- **Build Tool**: Platform-specific (check package.json)

---

## 2. Environment Setup

### Prerequisites

- Node.js (LTS version recommended, see `.nvmrc` or `engines` in package.json for exact version)
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Node.js Version Management

This project uses **`.nvmrc`** to manage Node.js versions. If you're using nvm:

```bash
nvm use  # if .nvmrc exists
```

---

## 3. Development Workflow

### Using TSX for Development

[tsx](https://tsx.is/) is available as a dev dependency for direct TypeScript execution:

```bash
# Run a single file
npx tsx src/main.ts

# Run with watch mode (recommended for development)
npx tsx watch src/main.ts
```

### Type Checking

TypeScript compilation is available via:

```bash
npm run type-check
```

### Development Server

If the project has a dev server (e.g., Vite, ts-node-dev, etc.), use:

```bash
npm run dev
```

---

## 4. Code Quality

### Formatting

This project uses **oxfmt** via:

```bash
npm run format
```

Or check formatting without applying changes:

```bash
npm run format:check
```

### Linting

Static analysis and linting is performed with **oxlint**:

```bash
npm run lint
```

Fix issues automatically where possible:

```bash
npm run lint:fix
```

### Type Checking

```bash
npm run type-check
```

---

## 5. Testing

### Test Runner

**Vitest** is the testing framework (API-compatible with Jest):

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest path/to/test.spec.ts

# Run tests in CI mode (once, no watch)
npx vitest run
```

### Common Test Scripts

- `npm test`: Run all tests once
- `npm run test:watch`: Watch mode for development
- `npm run test:coverage`: Generate coverage report
- `npm run test:ui`: Vitest UI mode

---

## 6. Building

### Production Build

```bash
npm run build
```

### Build Options

- Check individual build scripts in `package.json` (e.g., `build:lib`, `build:app`)

---

## 7. Deployment

### Staging Environment

```bash
npm run deploy:staging
```

### Production Environment

```bash
npm run deploy:production
```

---

## 8. File Structure Patterns

### Source Code

- `src/` - Main source code
  - `src/types/` - TypeScript type definitions
  - `src/utils/` - Utility functions
  - `src/lib/` - Library code
  - `src/main.ts` - Main entry point

### Tests

- `tests/` or `src/**/*.spec.ts` - Test files co-located with source
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

### Configuration

- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest configuration
- `oxlintrc.json` (if exists) - oxlint configuration
- `.npmrc` - npm configuration

---

## 9. Common Tasks

| Task                      | Command                      | Notes                     |
| ------------------------- | ---------------------------- | ------------------------- |
| Install dependencies      | `npm install`                |                           |
| Add production dependency | `npm install <pkg>`          | Check TypeScript versions |
| Add dev dependency        | `npm install -D <pkg>`       | e.g., testing libraries   |
| Format code               | `npm run format`             | Uses oxfmt                |
| Run linter                | `npm run lint`               | Uses oxlint               |
| Type check                | `npm run type-check`         |                           |
| Run tests                 | `npm test`                   | Vitest                    |
| Start development server  | `npm run dev`                | Check package.json        |
| Build project             | `npm run build`              |                           |
| Run pre-commit hooks      | `npm run prepare` or `husky` | If husky is configured    |

---

## 10. Version Control

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, etc.

Example:

```
feat(api): add new user endpoint
fix(ui): correct button alignment on mobile
```

### Pre-commit Hooks

If configured, pre-commit hooks are managed by **Husky** with lint-staged.

---

## 11. Environment Variables

### `.env` Files

- `.env` - Default environment
- `.env.development` - Development overrides
- `.env.test` - Test environment
- `.env.production` - Production overrides

**Never commit `.env` files with real secrets.**
Use `.env.example` as a template.

---

## 12. Troubleshooting

### Common Issues

**1. TypeScript errors after adding dependencies**
→ Run `npm install --save-dev @types/<package-name>` if types are missing.

**2. oxlint not finding issues**
→ Check `oxlintrc.json` for rules configuration. Run `npm run lint:fix` to auto-fix.

**3. Vitest not discovering tests**
→ Ensure test files are named `*.spec.ts` or `*.test.ts`, or update `vitest.config.ts`.

**4. TSX issues with new Node.js features**
→ Check the Node.js version in `.nvmrc`.

**5. Missing peer dependencies**
→ Install required peer dependencies explicitly.

---

## 13. Additional Resources

- **[TypeScript Documentation](https://www.typescriptlang.org/docs/)**
- **[Vitest Documentation](https://vitest.dev/)**
- **[oxfmt Documentation](https://github.com/oxc-project/oxc/tree/main/crates/oxfmt)**
- **[oxlint Documentation](https://github.com/oxc-project/oxc/tree/main/crates/oxlint)**
- **[tsx Documentation](https://tsx.is/)**

---

## 14. Agent-specific Instructions

### For AI Agents

When working on this project, follow these prioritized steps:

1. **Read `.nvmrc`** → Determine Node.js version
2. **Read `package.json`** → Understand scripts and dependencies
3. **Run `npm install`** → Sync environment
4. **Format code** → `npm run format` before contributing
5. **Lint code** → `npm run lint` to ensure quality
6. **Type check** → `npm run type-check` to catch errors
7. **Run tests** → Ensure existing tests pass
8. **Write tests** → New features should have test coverage
9. **Commit changes** → Follow Conventional Commits format

### CoCoding Standards

- Ensure all changes are type-safe
- Write clear, descriptive commit messages
- Document public APIs with JSDoc
- Add tests for new functionality
- Update README.md if public APIs change
- Keep formatting and linting passing at all times

---

_Last updated: @PROJECT_UPDATE_TIME@_
_Generated by: AI Agent_
