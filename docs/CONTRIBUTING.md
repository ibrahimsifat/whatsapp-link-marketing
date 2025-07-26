# Contributing Guide

Thank you for your interest in contributing to the WhatsApp Business Link Generator! This guide will help you get started with contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Basic knowledge of React, TypeScript, and Next.js

### Development Setup

1. **Fork the repository**
   \`\`\`bash
   git clone https://github.com/your-username/whatsapp-link-generator.git
   cd whatsapp-link-generator
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Run tests**
   \`\`\`bash
   npm run test
   \`\`\`

## 📋 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting. Please ensure your code follows these standards:

\`\`\`bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
\`\`\`

### TypeScript

- All new code must be written in TypeScript
- Use proper type definitions
- Avoid `any` types when possible
- Export types from appropriate files

### Component Guidelines

1. **File Naming**: Use kebab-case for file names (`contact-card.tsx`)
2. **Component Structure**:
   \`\`\`typescript
   // Imports
   import React from 'react'
   import { Button } from '@/components/ui/button'
   
   // Types
   interface ComponentProps {
     // props definition
   }
   
   // Component
   export function ComponentName({ prop1, prop2 }: ComponentProps) {
     // component logic
     return (
       // JSX
     )
   }
   \`\`\`

3. **Props**: Always define prop interfaces
4. **Hooks**: Use custom hooks for complex logic
5. **Error Handling**: Implement proper error boundaries

### Service Layer

1. **Service Structure**:
   \`\`\`typescript
   export class ServiceName {
     static async methodName(params: ParamType): Promise<ResultType> {
       try {
         // implementation
         return { success: true, data: result }
       } catch (error) {
         return { success: false, message: error.message }
       }
     }
   }
   \`\`\`

2. **Error Handling**: Always return structured results
3. **Validation**: Validate inputs using ValidationService
4. **Documentation**: Add JSDoc comments for public methods

## 🧪 Testing

### Writing Tests

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows

### Test Structure

\`\`\`typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', () => {
    const mockHandler = jest.fn()
    render(<ComponentName onAction={mockHandler} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test ComponentName.test.tsx
\`\`\`

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable

### Bug Report Template

\`\`\`markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Browser: [e.g. Chrome 91]
- OS: [e.g. Windows 10]
- Node.js: [e.g. 18.0.0]

## Additional Context
Any other context about the problem
\`\`\`

## 🚀 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Provide examples** if possible

### Feature Request Template

\`\`\`markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other context or screenshots
\`\`\`

## 📝 Pull Request Process

### Before Submitting

1. **Create an issue** first (unless it's a minor fix)
2. **Fork the repository** and create a feature branch
3. **Write tests** for your changes
4. **Update documentation** if needed
5. **Run all tests** and ensure they pass
6. **Follow code style** guidelines

### Pull Request Template

\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Updated existing tests

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
\`\`\`

### Branch Naming

Use descriptive branch names:
- `feature/add-bulk-export`
- `fix/phone-validation-bug`
- `docs/update-api-documentation`
- `refactor/contact-service-cleanup`

### Commit Messages

Follow conventional commit format:
\`\`\`
type(scope): description

feat(contacts): add bulk export functionality
fix(validation): resolve phone number validation issue
docs(api): update service documentation
refactor(ui): improve component structure
\`\`\`

## 🏗️ Project Structure

Understanding the project structure will help you contribute effectively:

\`\`\`
app/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── business/       # Business logic components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── services/           # Business logic services
├── types/              # TypeScript definitions
├── utils/              # Utility functions
├── constants/          # Application constants
└── styles/             # Global styles

docs/                   # Documentation
tests/                  # Test files
public/                 # Static assets
\`\`\`

## 🔍 Code Review Process

### For Contributors

1. **Self-review** your code before submitting
2. **Write clear descriptions** in your PR
3. **Respond promptly** to review feedback
4. **Make requested changes** in separate commits
5. **Keep PRs focused** on single features/fixes

### For Reviewers

1. **Be constructive** and helpful
2. **Focus on code quality** and maintainability
3. **Check for security issues**
4. **Verify tests are adequate**
5. **Approve when ready** or request changes

## 🎯 Areas for Contribution

We welcome contributions in these areas:

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Accessibility improvements
- Mobile responsiveness
- Test coverage improvements

### Medium Priority
- New features (with prior discussion)
- UI/UX enhancements
- Documentation improvements
- Code refactoring
- Internationalization

### Low Priority
- Developer experience improvements
- Build process optimizations
- Additional integrations
- Advanced features

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be patient with newcomers
- Provide constructive feedback
- Respect different opinions

### Be Collaborative
- Help others learn
- Share knowledge
- Ask questions when unclear
- Offer assistance

### Be Professional
- Keep discussions on-topic
- Avoid personal attacks
- Focus on the code, not the person
- Maintain a positive attitude

## 📚 Resources

### Documentation
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)

### External Resources
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Testing Library](https://testing-library.com)

## 🆘 Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** for similar problems
3. **Ask in discussions** for general questions
4. **Create an issue** for bugs or feature requests
5. **Contact maintainers** for urgent matters

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special mentions for outstanding contributions

Thank you for contributing to the WhatsApp Business Link Generator! 🎉
