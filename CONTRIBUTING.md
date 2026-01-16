# Contributing to Seera AI

Thank you for your interest in contributing to Seera AI! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL database (or use Neon for serverless PostgreSQL)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/seera-ai.git
   cd seera-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables.

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard routes (protected)
│   ├── (marketing)/       # Marketing pages (public)
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/
│   ├── accessibility/     # Accessibility components
│   ├── marketing/         # Marketing page components
│   ├── onboarding/        # User onboarding components
│   ├── providers/         # React context providers
│   ├── resume/            # Resume builder components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
│   ├── i18n/              # Internationalization
│   └── ...
└── __tests__/             # Test files
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer interfaces over types for object shapes
- Use `unknown` instead of `any` where possible

### React

- Use functional components with hooks
- Prefer named exports
- Use `'use client'` directive only when necessary
- Keep components focused and small

### CSS/Styling

- Use Tailwind CSS for styling
- Use the `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use CSS variables for theming

### File Naming

- Use kebab-case for file names: `my-component.tsx`
- Use PascalCase for component names: `MyComponent`
- Use camelCase for functions and variables

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Writing Tests

- Place test files in `src/__tests__/` or alongside components with `.test.tsx` suffix
- Use React Testing Library for component tests
- Test behavior, not implementation details
- Aim for meaningful test coverage, not 100%

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

Example: `feature/add-linkedin-import`

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(resume): add AI-powered bullet point suggestions`
- `fix(auth): resolve session expiration issue`
- `docs(readme): update installation instructions`

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Write or update tests as needed
4. Ensure all tests pass: `npm run test:ci`
5. Ensure no lint errors: `npm run lint`
6. Create a pull request with a clear description
7. Address review feedback

## Accessibility

- Use semantic HTML elements
- Ensure keyboard navigation works
- Add ARIA labels where needed
- Test with screen readers
- Maintain color contrast ratios

## Internationalization

We support English and Arabic (RTL). When adding new text:

1. Add strings to both `src/lib/i18n/locales/en.ts` and `ar.ts`
2. Use the `useLocale()` hook to access translations
3. Test both LTR and RTL layouts

## Environment Variables

See `.env.example` for all available variables. Never commit sensitive values.

Required for development:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL

Optional:
- `OPENAI_API_KEY` - For AI features
- `RESEND_API_KEY` - For email sending
- `STRIPE_SECRET_KEY` - For payments

## Getting Help

- Check existing issues and discussions
- Ask questions in pull request comments
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.
