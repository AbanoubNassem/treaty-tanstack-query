# Contributing to treaty-tanstack-query

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or higher
- [Node.js](https://nodejs.org) v20+ (for some tooling)
- Git

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/treaty-tanstack-query.git
   cd treaty-tanstack-query
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Run the development server**

   ```bash
   bun run dev
   ```

   This starts both the library in watch mode and the example app.

4. **Run tests**

   ```bash
   bun run test
   ```

## Project Structure

```
├── packages/
│   └── treaty-tanstack-react-query/   # The main library
│       ├── src/                       # Source code
│       └── tests/                     # Test files
├── apps/
│   └── react-fullstack-example/       # Demo application
└── docs/                              # VitePress documentation
```

## Making Changes

### Branch Naming

Create a branch with a descriptive name:

- `feat/add-new-feature` - New features
- `fix/issue-description` - Bug fixes
- `docs/update-section` - Documentation changes
- `refactor/improve-thing` - Code refactoring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Your commits should follow this format:

```
type(scope): description

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
feat(query): add support for placeholder data
fix(mutation): handle error responses correctly
docs: update installation instructions
```

### Code Style

- TypeScript strict mode is enabled
- Run `bun run typecheck` before committing
- Keep code simple and readable
- Add JSDoc comments for public APIs

### Testing

- Write tests for new features
- Ensure existing tests pass: `bun run test`
- Test files go in `packages/treaty-tanstack-react-query/tests/`

### Documentation

If your change affects the public API:

1. Update relevant docs in the `docs/` folder
2. Add code examples where helpful
3. Preview docs locally:
   ```bash
   cd docs
   bun run dev
   ```

## Pull Request Process

1. **Update your fork** with the latest upstream changes:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch** to your fork:

   ```bash
   git push origin your-branch-name
   ```

3. **Open a Pull Request** against the `main` branch

4. **Fill out the PR template** with:
   - What the change does
   - Why it's needed
   - How to test it

5. **Address review feedback** if requested

### PR Checklist

- [ ] Tests pass (`bun run test`)
- [ ] Types check (`bun run typecheck`)
- [ ] Commits follow conventional commits format
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or clearly documented)

## Reporting Issues

### Bug Reports

Include:
- Library version
- Minimal reproduction code
- Expected vs actual behavior
- Error messages (if any)

### Feature Requests

Include:
- Use case description
- Proposed API (if you have ideas)
- Why existing solutions don't work

## Questions?

- Open a [GitHub Discussion](https://github.com/AbanoubNassem/treaty-tanstack-query/discussions)
- Check existing [issues](https://github.com/AbanoubNassem/treaty-tanstack-query/issues)

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](LICENSE).
