# API Documentation

## Base URL
```
https://api.aistudyhub.vn/v1
```

## Authentication
All API requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### Documents
- `GET /documents` - List all documents
- `POST /documents` - Upload new document
- `GET /documents/:id` - Get document details
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document

### Chatbot
- `POST /chatbot/chat` - Send message to chatbot
- `GET /chatbot/history` - Get chat history
- `DELETE /chatbot/history/:id` - Delete chat message

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user details

## Error Responses
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

*Last Updated: [Date]*
*Version: 1.0*
