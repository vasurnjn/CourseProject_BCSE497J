# API Documentation

## Analysis Endpoints
- \`POST /api/analyze/github\` - Start analysis of a GitHub repository
- \`POST /api/analyze/upload\` - Start analysis of a ZIP file
- \`GET /api/analyze/status/:jobId\` - Get analysis progress

## Project Endpoints
- \`GET /api/projects/:id\` - Get basic project info
- \`GET /api/projects/:id/graph\` - Get dependency graph (nodes and edges)
- \`GET /api/projects/:id/statistics\` - Get project metrics
- \`GET /api/projects/:id/cycles\` - Get circular dependencies
- \`GET /api/projects/:id/unused-dependencies\` - Get unused external dependencies
- \`GET /api/projects/:id/node/:nodeId\` - Get details for a specific node
- \`GET /api/projects/:id/impact/:nodeId\` - Get change impact analysis for a node
