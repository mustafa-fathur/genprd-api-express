# GenPRD API Documentation

## Base URL

All API endpoints are prefixed with:

```
/api
```

For local development, the full URL would be:

```
http://localhost:3000/api
```

For production, the full URL would be:

```
https://express-backend-418864732285.asia-southeast2.run.app/api
```

## Authentication

All routes except `/api/auth/*` require authentication via JWT token in the Authorization header:

```
Authorization: Bearer jwt-token-string
```

### Conventional Auth

#### Register

##### POST /api/auth/register

Registers a new user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "User Name"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "access_token": "jwt-token-string",
    "refresh_token": "refresh-token-string",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "avatar_url": "avatar-url"
    }
  }
}
```

#### Login

##### POST /api/auth/login

Logs in a user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "jwt-token-string",
    "refresh_token": "refresh-token-string",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "avatar_url": "avatar-url"
    }
  }
}
```

#### Forgot Password

##### POST /api/auth/forgot-password

Requests a password reset link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "If your email is registered, you will receive a password reset link"
}
```

#### Reset Password

##### POST /api/auth/reset-password

Resets user password using a reset token.

**Request Body:**

```json
{
  "token": "reset-token-string",
  "password": "new_secure_password"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Password has been reset successfully. Please login with your new password."
}
```

### Google OAuth

#### Web Authentication

##### GET /api/auth/web/google

Initiates Google OAuth authentication flow for web clients.

**Response:** Redirects to Google authentication page.

##### GET /api/auth/web/google/callback

Callback endpoint for Google OAuth web authentication.

**Response:** Redirects to frontend with tokens in URL:
```
${FRONTEND_URL}/auth/callback?token=${accessToken}&refresh_token=${refreshToken}&user=${userData}
```

#### Mobile Authentication

##### GET /api/auth/mobile/google

Initiates Google OAuth authentication flow for mobile clients.

**Response:** Redirects to Google authentication page.

##### GET /api/auth/mobile/google/callback

Callback endpoint for Google OAuth mobile authentication.

**Response:**

```json
{
  "status": "success",
  "access_token": "jwt-token-string",
  "refresh_token": "refresh-token-string",
  "user": {
    "id": "user-id",
    "email": "user-email@example.com",
    "name": "User Name",
    "avatar_url": "profile-picture-url"
  }
}
```

##### POST /api/auth/verify-google-token

Verifies a Google token from mobile authentication.

**Request Body:**

```json
{
  "id_token": "google-id-token",
  "access_token": "google-access-token"
}
```

**Response:** Authentication response with JWT token.

### Refresh Token

##### POST /api/auth/refresh

Refresh an expired JWT token.

**Request Body:**

```json
{
  "refresh_token": "refresh-token-string"
}
```

**Response:**

```json
{
  "status": "success",
  "access_token": "new-jwt-token-string"
}
```

**Error Responses:**

- 401 Unauthorized - Invalid refresh token
- 400 Bad Request - Missing refresh token

### Logout

##### POST /api/auth/logout

Logs out a user and invalidates their refresh token.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## Dashboard

### Get Dashboard Data

##### GET /api/dashboard

Retrieves dashboard statistics and recent data for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "counts": {
      "totalPRD": 15,
      "totalPersonnel": 8,
      "totalDraft": 3,
      "totalInProgress": 5,
      "totalFinished": 6,
      "totalArchived": 1
    },
    "recentPRDs": [
      {
        "id": "prd-id-1",
        "product_name": "Product Name",
        "document_stage": "inprogress",
        "document_version": "1.0",
        "created_at": "2025-05-23T00:00:00.000Z",
        "updated_at": "2025-05-23T00:00:00.000Z"
      }
    ]
  }
}
```

## User Profile

### Get User Profile

##### GET /api/users/profile

Retrieves the profile information for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "user-id",
    "name": "User Name",
    "email": "user-email@example.com",
    "avatar_url": "profile-picture-url",
    "member_since": "2025-05-23T00:00:00.000Z"
  }
}
```

### Update User Profile

##### PUT /api/users/profile

Updates the profile information for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Request Body:**

```json
{
  "name": "Updated Name"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "user-id",
    "name": "Updated Name",
    "email": "user-email@example.com",
    "avatar_url": "profile-picture-url"
  }
}
```

## Personnel Management

### Get All Personnel

##### GET /api/personnel

Retrieves a list of all personnel records for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "personnel-id-1",
      "name": "Personnel Name",
      "role": "Software Engineer",
      "contact": "contact@example.com",
      "user_id": "user-id",
      "created_at": "2025-05-23T00:00:00.000Z",
      "updated_at": "2025-05-23T00:00:00.000Z"
    }
  ]
}
```

### Get Personnel by ID

##### GET /api/personnel/:id

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
  "status": "success",
  "data": {
    "id": "personnel-id",
    "name": "Personnel Name",
    "role": "Software Engineer",
    "contact": "contact@example.com",
    "user_id": "user-id",
    "created_at": "2025-05-23T00:00:00.000Z",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist

### Create Personnel

##### POST /api/personnel

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
  "role": "Product Manager",
  "contact": "contact@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Personnel created successfully",
  "data": {
    "id": "new-personnel-id",
    "name": "New Personnel",
    "role": "Product Manager",
    "contact": "contact@example.com",
    "user_id": "user-id",
    "created_at": "2025-05-23T00:00:00.000Z",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 400 Bad Request - Missing required fields (name, role, contact)

### Update Personnel

##### PUT /api/personnel/:id

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
  "role": "Updated Role",
  "contact": "updated@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Personnel updated successfully",
  "data": {
    "id": "personnel-id",
    "name": "Updated Personnel Name",
    "role": "Updated Role",
    "contact": "updated@example.com",
    "user_id": "user-id",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist

### Delete Personnel

##### DELETE /api/personnel/:id

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
  "status": "success",
  "message": "Personnel deleted successfully"
}
```

**Error Responses:**

- 404 Not Found - Personnel with specified ID does not exist

## PRD (Product Requirements Document)

### Get All PRDs

##### GET /api/prd

Retrieves a list of all PRD records for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Query Parameters:**

```json
{
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "stage": "string (filter by document_stage)",
  "search": "string (search in product_name and project_overview)",
  "sort": "string (default: 'updated_at')",
  "order": "string (default: 'DESC')",
  "all": "boolean (get all PRDs without pagination)"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "total": "number",
    "pages": "number",
    "current_page": "number",
    "prds": [
      {
        "id": "prd-id-1",
        "user_id": "user-id",
        "product_name": "TaskMaster Pro",
        "document_version": "1.0",
        "document_stage": "draft",
        "project_overview": "A comprehensive task management application...",
        "start_date": "2025-05-23",
        "end_date": "2025-12-31",
        "deadline": "2025-11-15",
        "is_pinned": false,
        "created_at": "2025-05-23T00:00:00.000Z",
        "updated_at": "2025-05-23T00:00:00.000Z",
        "last_viewed_at": "2025-05-23T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Recent PRDs

##### GET /api/prd/recent

Retrieves a list of recent PRD records for the authenticated user.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Query Parameters:**

```json
{
  "limit": "number (default: 10)"
}
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "prd-id-1",
      "product_name": "TaskMaster Pro",
      "document_stage": "draft",
      "deadline": "2025-11-15",
      "updated_at": "2025-05-23T00:00:00.000Z",
      "is_pinned": false,
      "last_viewed_at": "2025-05-23T00:00:00.000Z"
    }
  ]
}
```

### Get PRD by ID

##### GET /api/prd/:id

Retrieves a specific PRD record by ID.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to retrieve

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "prd-id",
    "user_id": "user-id",
    "product_name": "TaskMaster Pro",
    "document_version": "1.0",
    "document_stage": "draft",
    "project_overview": "A comprehensive task management application...",
    "start_date": "2025-05-23",
    "end_date": "2025-12-31",
    "deadline": "2025-11-15",
    "document_owners": ["John Doe"],
    "developers": ["Dev Team A"],
    "stakeholders": ["Product Manager"],
    "darci_roles": {
      "decider": ["CEO"],
      "accountable": ["Product Manager"],
      "responsible": ["Dev Team A"],
      "consulted": ["UX Designer"],
      "informed": ["Marketing Team"]
    },
    "generated_sections": {
      "overview": {
        "sections": [
          {
            "title": "Problem Statement",
            "content": "Current task management solutions lack..."
          }
        ]
      },
      "user_stories": {
        "stories": [
          {
            "title": "User Login",
            "priority": "high",
            "user_story": "As a user, I want to login securely...",
            "acceptance_criteria": "Given valid credentials..."
          }
        ]
      }
    },
    "timeline": [
      {
        "time_period": "2025-06-01 - 2025-06-30",
        "activity": "Requirements Gathering",
        "pic": "Product Manager"
      }
    ],
    "is_pinned": false,
    "last_viewed_at": "2025-05-23T00:00:00.000Z",
    "created_at": "2025-05-23T00:00:00.000Z",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist

### Create PRD

##### POST /api/prd

Creates a new PRD with AI-generated content via Flask API.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**Request Body:**

```json
{
  "product_name": "TaskMaster Pro",
  "document_version": "1.0",
  "project_overview": "A comprehensive task management application for teams...",
  "start_date": "2025-05-23",
  "end_date": "2025-12-31",
  "deadline": "2025-11-15",
  "document_owners": ["John Doe"],
  "developers": ["Dev Team A", "Dev Team B"],
  "stakeholders": ["Product Manager", "CEO"],
  "darci_roles": {
    "decider": ["CEO"],
    "accountable": ["Product Manager"],
    "responsible": ["Dev Team A"],
    "consulted": ["UX Designer"],
    "informed": ["Marketing Team"]
  },
  "generate_content": true,
  "document_stage": "draft"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "PRD created successfully",
  "data": {
    "id": "new-prd-id",
    "user_id": "user-id",
    "product_name": "TaskMaster Pro",
    "document_version": "1.0",
    "document_stage": "draft",
    "project_overview": "A comprehensive task management application...",
    "start_date": "2025-05-23",
    "end_date": "2025-12-31",
    "deadline": "2025-11-15",
    "document_owners": ["John Doe"],
    "developers": ["Dev Team A", "Dev Team B"],
    "stakeholders": ["Product Manager", "CEO"],
    "darci_roles": {
      "decider": ["CEO"],
      "accountable": ["Product Manager"],
      "responsible": ["Dev Team A"],
      "consulted": ["UX Designer"],
      "informed": ["Marketing Team"]
    },
    "generated_sections": {
      "overview": {
        "sections": [...]
      },
      "user_stories": {
        "stories": [...]
      },
      "success_metrics": {
        "metrics": [...]
      },
      "project_timeline": {
        "phases": [...]
      },
      "darci": {
        "roles": [...]
      }
    },
    "timeline": [
      {
        "time_period": "2025-06-01 - 2025-06-30",
        "activity": "Requirements Gathering",
        "pic": "Product Manager"
      }
    ],
    "is_pinned": false,
    "last_viewed_at": "2025-05-23T00:00:00.000Z",
    "created_at": "2025-05-23T00:00:00.000Z",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 400 Bad Request - Missing required fields (product_name, project_overview, start_date, end_date)

### Update PRD

##### PUT /api/prd/:id

Updates an existing PRD (manual editing only, no AI regeneration).

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to update

**Request Body:**

```json
{
  "product_name": "Updated TaskMaster Pro",
  "document_version": "1.1",
  "project_overview": "Updated project overview...",
  "start_date": "2025-06-01",
  "end_date": "2025-12-31",
  "deadline": "2025-10-30",
  "document_owners": ["John Doe", "Jane Smith"],
  "developers": ["Dev Team A"],
  "stakeholders": ["Product Manager"],
  "darci_roles": {
    "decider": ["CEO"],
    "accountable": ["Product Manager"],
    "responsible": ["Dev Team A"],
    "consulted": ["UX Designer"],
    "informed": ["Marketing Team"]
  },
  "generated_sections": {
    "overview": {
      "sections": [
        {
          "title": "Updated Problem Statement",
          "content": "Updated content..."
        }
      ]
    }
  },
  "timeline": [
    {
      "time_period": "2025-06-01 - 2025-06-30",
      "activity": "Updated Requirements Gathering",
      "pic": "Product Manager"
    }
  ],
  "is_pinned": true
}
```

**Response:**

```json
{
  "status": "success",
  "message": "PRD updated successfully",
  "data": {
    "id": "prd-id",
    "document_stage": "inprogress",
    "updated_at": "2025-05-23T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist

### Delete PRD

##### DELETE /api/prd/:id

Deletes a PRD record.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to delete

**Response:**

```json
{
  "status": "success",
  "message": "PRD deleted successfully"
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist or you do not have permission to delete it

### Archive PRD

##### PATCH /api/prd/:id/archive

Archives a PRD (changes document_stage to 'archived') or unarchives if already archived.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to archive/unarchive

**Response:**

```json
{
  "status": "success",
  "message": "PRD archived successfully",
  "data": {
    "id": "prd-id",
    "document_stage": "archived"
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist

### Toggle Pin PRD

##### PATCH /api/prd/:id/pin

Toggles the pinned status of a PRD.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to pin/unpin

**Response:**

```json
{
  "status": "success",
  "message": "PRD pinned successfully",
  "data": {
    "id": "prd-id",
    "is_pinned": true
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist

### Update PRD Stage

##### PATCH /api/prd/:id/stage

Updates the document stage of a PRD.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to update

**Request Body:**

```json
{
  "document_stage": "inprogress"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "PRD stage updated to inprogress",
  "data": {
    "id": "prd-id",
    "document_stage": "inprogress"
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist
- 400 Bad Request - Invalid document stage value

### Download PRD as PDF

##### GET /api/prd/:id/download

Generates and downloads a PDF version of the PRD. Can optionally update document_stage to 'finished'.

**Authentication Required:** Yes (JWT Token)

**Request Headers:**

```
Authorization: Bearer jwt-token-string
```

**URL Parameters:**

- `id` - The ID of the PRD to download

**Query Parameters:**

- `update_stage` - Boolean (default: true) - Whether to update document_stage to 'finished'

**Response:**

```json
{
  "status": "success",
  "message": "PDF generated successfully",
  "data": {
    "download_url": "https://storage.googleapis.com/bucket-name/folder/PRD_TaskMaster_Pro_123_timestamp.pdf",
    "public_url": "https://storage.googleapis.com/bucket-name/folder/PRD_TaskMaster_Pro_123_timestamp.pdf",
    "file_name": "PRD_TaskMaster_Pro_123_timestamp.pdf",
    "gcs_path": "prd-pdf-documents/PRD_TaskMaster_Pro_123_timestamp.pdf",
    "prd_id": "prd-id",
    "document_stage": "finished",
    "generated_at": "2025-05-23T00:00:00.000Z",
    "expires_at": "2025-05-24T00:00:00.000Z"
  }
}
```

**Error Responses:**

- 404 Not Found - PRD with specified ID does not exist
- 500 Internal Server Error - PDF generation failed

## PRD Fields Explanation

### Core Fields
- **product_name**: Name of the product/project
- **document_version**: Version of the PRD document
- **document_stage**: Current stage (draft, inprogress, finished, archived)
- **project_overview**: Description of the project

### Timeline Fields
- **start_date**: Project start date (DATEONLY format: YYYY-MM-DD)
- **end_date**: Project end date (DATEONLY format: YYYY-MM-DD)
- **deadline**: Business deadline (DATEONLY format: YYYY-MM-DD, optional, independent of project timeline)

### People Fields
- **document_owners**: Array of document owner names
- **developers**: Array of developer names
- **stakeholders**: Array of stakeholder names
- **darci_roles**: DARCI matrix with role assignments

### Meta Fields
- **is_pinned**: Boolean indicating if PRD is pinned
- **last_viewed_at**: Timestamp of last view
- **generated_sections**: AI-generated content sections
- **timeline**: Project timeline phases

**Important Notes:**
- The `deadline` field is independent of `start_date` and `end_date`
- `deadline` represents business deadline, while `start_date`/`end_date` represent project execution timeline
- `deadline` can be null, before, during, or after the project timeline

## Document Stages

PRDs have the following stages:

- **draft** - Initial creation state
- **inprogress** - Currently being edited (auto-set on first edit)
- **finished** - Downloaded as PDF (auto-set on download)
- **archived** - Archived for long-term storage

## Error Handling

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Unauthorized access"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid request data",
  "error": "Detailed error message"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "An unexpected error occurred",
  "error": "Detailed error message (development only)"
}
```

## Rate Limiting

- PRD creation with AI generation has a 3-minute timeout due to Gemini API processing time
- PDF generation may take 30-60 seconds depending on document complexity

## External Dependencies

- **Flask API**: Used for AI-powered PRD content generation
- **Google Cloud Storage**: Used for PDF file storage and public access
- **Google OAuth**: Used for user authentication
- **Firebase Cloud Messaging**: Used for push notifications

## Environment Variables

Required environment variables:

```
BASE_URL: Base URL for the API
FRONTEND_URL: URL for the frontend application
FLASK_URL: URL for the Flask API service
GOOGLE_CLIENT_ID: Google OAuth client ID
GOOGLE_CLIENT_SECRET: Google OAuth client secret
```