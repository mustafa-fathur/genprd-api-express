# GenPRD API Documentation

## Base URL

All API endpoints are prefixed with:

```
/api
```

For local development, the full URL would be:

```
http://localhost:8080/api
```

## Authentication

### Google OAuth

#### GET /api/auth/google

Initiates Google OAuth authentication flow.

**Response:** Redirects to Google authentication page.

#### GET /api/auth/google/callback

Callback endpoint for Google OAuth authentication.

**Response:**

```json
{
  "token": "jwt-token-string",
  "refreshToken": "refresh-token-string",
  "user": {
    "id": "user-id",
    "email": "user-email@example.com",
    "name": "User Name",
    "picture": "profile-picture-url"
  }
}
```

### Refresh Token

#### POST /api/auth/refresh

Refresh an expired JWT token.

**Request Body:**

```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response:**

```json
{
  "token": "new-jwt-token-string"
}
```

**Error Responses:**

- 401 Unauthorized - Invalid refresh token
- 400 Bad Request - Missing refresh token

### Logout

#### POST /api/auth/logout

Logs out a user and invalidates their refresh token.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

## User Profile

### Get User Profile

#### GET /api/users/profile

Retrieves the profile information for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "id": "user-id",
  "email": "user-email@example.com",
  "name": "User Name",
  "picture": "profile-picture-url",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update User Profile

#### PUT /api/users/profile

Updates the profile information for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "picture": "updated-picture-url"
}
```

**Response:**

```json
{
  "id": "user-id",
  "email": "user-email@example.com",
  "name": "Updated Name",
  "picture": "updated-picture-url",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## Personnel Management

### Get All Personnel

#### GET /api/personnel

Retrieves a list of all personnel records.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
[
  {
    "id": "personnel-id-1",
    "name": "Personnel Name",
    "position": "Job Position",
    "department": "Department",
    "contact": "contact@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": "personnel-id-2",
    "name": "Another Personnel",
    "position": "Another Position",
    "department": "Another Department",
    "contact": "another@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### Get Personnel by ID

#### GET /api/personnel/:id

Retrieves a specific personnel record by ID.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the personnel to retrieve

**Response:**

```json
{
  "id": "personnel-id",
  "name": "Personnel Name",
  "position": "Job Position",
  "department": "Department",
  "contact": "contact@example.com",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist

### Create Personnel

#### POST /api/personnel

Creates a new personnel record.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Request Body:**

```json
{
  "name": "New Personnel",
  "position": "Job Position",
  "department": "Department",
  "contact": "contact@example.com"
}
```

**Response:**

```json
{
  "id": "new-personnel-id",
  "name": "New Personnel",
  "position": "Job Position",
  "department": "Department",
  "contact": "contact@example.com",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 400 Bad Request - Missing required fields

### Update Personnel

#### PUT /api/personnel/:id

Updates an existing personnel record.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the personnel to update

**Request Body:**

```json
{
  "name": "Updated Personnel Name",
  "position": "Updated Position",
  "department": "Updated Department",
  "contact": "updated@example.com"
}
```

**Response:**

```json
{
  "id": "personnel-id",
  "name": "Updated Personnel Name",
  "position": "Updated Position",
  "department": "Updated Department",
  "contact": "updated@example.com",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist
- 400 Bad Request - Invalid request body

### Delete Personnel

#### DELETE /api/personnel/:id

Deletes a personnel record.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the personnel to delete

**Response:**

```json
{
  "message": "Personnel deleted successfully"
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist

## PRD (Product Requirements Document)

**Note:** PRD endpoints are currently under development. The basic route structure is in place, but full implementation of CRUD operations is pending.

### GET /api/prd

Currently returns a placeholder message.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "message": "Ini Route PRD"
}
```

## Error Handling

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Authentication Requirements

All endpoints except `/api/auth/google` and `/api/auth/google/callback` require authentication via a JWT token in the Authorization header:

```
Authorization: Bearer jwt-token-string
```

If the token is missing, invalid, or expired, a 401 Unauthorized response will be returned.