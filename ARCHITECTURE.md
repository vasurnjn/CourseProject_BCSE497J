# Architecture

## Frontend
- React 18, Vite, Tailwind CSS
- 3D rendering with Three.js + React Three Fiber
- API client: Axios

## Backend
- Express.js, file upload handling
- Static analysis engine
- Parser: `@babel/parser` for JavaScript/TypeScript, regex for Python
- Data Model: DependencyGraph

## Data Flow
Upload/Clone -> Scanner -> Parser -> DependencyGraph -> Algorithms -> REST API -> React UI
