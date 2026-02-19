# Contributing to Sonora

Thank you for your interest in contributing to Sonora! We welcome contributions from everyone. By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub describing the problem, including:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

### Suggesting Enhancements

We welcome new feature ideas! Open an issue to discuss your suggestion before starting work.

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Setup

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` file (see README for variables).
5. Run the server:
   ```bash
   python main.py
   ```

### Frontend (React + Vite)

1. Navigate to the project root:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Style Guide

- **Python**: Follow PEP 8 guidelines.
- **JavaScript/React**: Follow standard React best practices. Use functional components and hooks.
- **Commits**: Write clear, descriptive commit messages.

## License

By contributing, you agree that your contributions will be licensed under the MIT License used by this project.
