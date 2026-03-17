# SkinEasy Backend API Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [User Profile](#user-profile-endpoints)
  - [Diagnosis](#diagnosis-endpoints)
  - [Journal - Sleep](#journal---sleep-entries)
  - [Journal - Sport](#journal---sport-entries)
  - [Journal - Meal](#journal---meal-entries)

---

## Overview

The SkinEasy backend API is a RESTful API that handles user authentication, diagnosis data, and daily journal tracking (sleep, nutrition, sport).

**Key Features:**

- JWT-based authentication with refresh tokens
- User profile management
- Skin diagnosis tracking
- Daily journal entries (sleep, nutrition, sport)
- Image upload for meal photos
- UTC-based date handling

---

## Authentication

All endpoints (except login and register) require JWT authentication.

**Include the access token in the Authorization header:**

```http
Authorization: Bearer <access_token>
```

**Token Lifecycle:**

1. Login/Register returns `access_token` and `refresh_token`
2. Access token expires after a set period
3. When 401 received, use refresh token to get new access token
4. If refresh fails, user must re-authenticate

---

## Base URL

```
Development: http://localhost:3000
Production: https://api.skineasy.com
```

All endpoints are prefixed with `/api/v1`

**Full endpoint format:**

```
{BASE_URL}/api/v1/{endpoint}
```

---

## Response Format

All successful responses follow this structure:

```typescript
{
  data: T; // The actual response data
}
```

**Examples:**

```json
// Single object response
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe"
  }
}

// Array response
{
  "data": [
    { "id": 1, "date": "2025-01-15T00:00:00.000Z", "hours": 7.5, "quality": 4 },
    { "id": 2, "date": "2025-01-16T00:00:00.000Z", "hours": 8, "quality": 5 }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning               | Description                                                    |
| ---- | --------------------- | -------------------------------------------------------------- |
| 200  | OK                    | Request succeeded                                              |
| 201  | Created               | Resource created successfully                                  |
| 204  | No Content            | Request succeeded, no content returned (e.g., DELETE)          |
| 400  | Bad Request           | Validation error or malformed request                          |
| 401  | Unauthorized          | Missing, invalid, or expired JWT token                         |
| 404  | Not Found             | Resource doesn't exist                                         |
| 409  | Conflict              | Resource already exists (e.g., duplicate sleep entry for date) |
| 413  | Payload Too Large     | File upload exceeds maximum size                               |
| 500  | Internal Server Error | Server error                                                   |

### Error Response Format

```json
{
  "message": "Error description here",
  "statusCode": 400,
  "error": "Bad Request"
}
```

**Examples:**

```json
// Validation error
{
  "message": "Validation failed",
  "statusCode": 400,
  "error": "Bad Request"
}

// Duplicate entry
{
  "message": "Sleep entry already exists for this date",
  "statusCode": 409,
  "error": "Conflict"
}

// Unauthorized
{
  "message": "Unauthorized",
  "statusCode": 401,
  "error": "Unauthorized"
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "skinType": null
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error (missing fields, invalid email, weak password)
- `409 Conflict` - Email already registered

---

#### 2. Login

Authenticate an existing user.

**Endpoint:** `POST /api/v1/auth/login`

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "skinType": "combination"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials

---

#### 3. Refresh Token

Get a new access token using a refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Headers:**

```http
Content-Type: application/json
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or expired refresh token

---

### User Profile Endpoints

#### 1. Get Current User Profile

Get the authenticated user's profile.

**Endpoint:** `GET /api/v1/auth/me`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "skinType": "combination"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

---

#### 2. Update User Profile

Update the authenticated user's profile.

**Endpoint:** `PUT /api/v1/user/profile`

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**

```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "skinType": "combination"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token
- `409 Conflict` - Email already in use

---

### Diagnosis Endpoints

#### 1. Get Latest Diagnosis

Get the user's most recent diagnosis (including routine).

**Endpoint:** `GET /api/v1/diagnosis/latest`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "skinType": "combination",
    "concerns": ["acne", "dryness"],
    "createdAt": "2025-01-10T12:00:00.000Z",
    "routine": {
      "morning": [
        {
          "id": 1,
          "order": 1,
          "productName": "Gentle Cleanser",
          "productUrl": "https://skineasy.com/products/gentle-cleanser",
          "description": "Removes impurities without stripping skin"
        },
        {
          "id": 2,
          "order": 2,
          "productName": "Hydrating Serum",
          "productUrl": "https://skineasy.com/products/hydrating-serum",
          "description": "Provides intense hydration"
        }
      ],
      "evening": [
        {
          "id": 3,
          "order": 1,
          "productName": "Oil Cleanser",
          "productUrl": "https://skineasy.com/products/oil-cleanser",
          "description": "Dissolves makeup and SPF"
        }
      ]
    }
  }
}
```

**Error Responses:**

- `404 Not Found` - No diagnosis exists for this user
- `401 Unauthorized` - Missing or invalid JWT token

**Note:** Frontend should redirect to diagnosis flow (Typeform) when receiving 404.

---

### Journal - Sleep Entries

Sleep entries are **unique per customer per day** - only one entry allowed per date.

**Date Format:** All dates must be sent in **UTC ISO 8601 format**:

```
"2025-01-15T00:00:00.000Z"
```

---

#### 1. Create or Update Sleep Entry (Upsert)

Create a new sleep entry or update existing one for the date.

**Endpoint:** `PUT /api/v1/journal/sleep/upsert`

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "hours": 7.5,
  "quality": 4
}
```

**Validation Rules:**

- `date`: Required, ISO 8601 UTC format
- `hours`: Required, 0-24
- `quality`: Required, 1-5

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "hours": 7.5,
    "quality": 4,
    "created_at": "2025-01-15T09:20:00.000Z"
  },
  "created": false
}
```

**Response Fields:**

- `created`: `true` if new entry, `false` if updated existing

**Error Responses:**

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 2. Get All Sleep Entries

Get all sleep entries for the authenticated user.

**Endpoint:** `GET /api/v1/journal/sleep`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 2,
      "customer_id": 1,
      "date": "2025-01-16T00:00:00.000Z",
      "hours": 8,
      "quality": 5,
      "created_at": "2025-01-16T10:30:00.000Z"
    },
    {
      "id": 1,
      "customer_id": 1,
      "date": "2025-01-15T00:00:00.000Z",
      "hours": 7.5,
      "quality": 4,
      "created_at": "2025-01-15T09:20:00.000Z"
    }
  ]
}
```

**Note:** Entries are sorted by date in descending order (most recent first).

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

---

#### 3. Get Single Sleep Entry

Get a specific sleep entry by ID.

**Endpoint:** `GET /api/v1/journal/sleep/:id`

**Path Parameters:**

- `id` (number) - Sleep entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "hours": 7.5,
    "quality": 4,
    "created_at": "2025-01-15T09:20:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist or doesn't belong to user
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 4. Update Sleep Entry

Update an existing sleep entry.

**Endpoint:** `PUT /api/v1/journal/sleep/:id`

**Path Parameters:**

- `id` (number) - Sleep entry ID

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "hours": 8,
  "quality": 5
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "hours": 8,
    "quality": 5,
    "created_at": "2025-01-15T09:20:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 5. Delete Sleep Entry

Delete a sleep entry.

**Endpoint:** `DELETE /api/v1/journal/sleep/:id`

**Path Parameters:**

- `id` (number) - Sleep entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

No response body.

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `401 Unauthorized` - Missing or invalid JWT token

---

### Journal - Sport Entries

Multiple sport entries allowed per day.

**Sport Types (Enum):**

- `yoga`
- `cardio`
- `swimming`
- `running`
- `cycling`
- `strength`
- `pilates`
- `hiking`
- `dancing`
- `other`

**Date Format:** UTC ISO 8601 format: `"2025-01-15T00:00:00.000Z"`

---

#### 1. Get Sport Types

Get all available sport types from the backend.

**Endpoint:** `GET /api/v1/sport-types`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "yoga",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 2,
      "name": "cardio",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 3,
      "name": "swimming",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 4,
      "name": "running",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 5,
      "name": "cycling",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 6,
      "name": "strength",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 7,
      "name": "pilates",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 8,
      "name": "hiking",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 9,
      "name": "dancing",
      "created_at": "2025-12-21T11:28:31.000Z"
    },
    {
      "id": 10,
      "name": "other",
      "created_at": "2025-12-21T11:28:31.000Z"
    }
  ]
}
```

**Note:** The frontend service layer automatically transforms this to an array of `name` strings for easier use in the UI.

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token

**Frontend Implementation:**

```typescript
// Fetch sport types on app initialization or when needed
const { data: sportTypes } = useSportTypes()

// Use for sport activity selector UI
sportTypes?.map(type => (
  <Button key={type} title={t(`journal.sport.activities.${type}`)} />
))
```

---

#### 2. Create Sport Entry

Create a new sport entry.

**Endpoint:** `POST /api/v1/journal/sport`

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "type": "running",
  "duration": 30,
  "intensity": 4
}
```

**Validation Rules:**

- `date`: Required, ISO 8601 UTC format
- `type`: Required, must be one of predefined enum values
- `duration`: Required, minimum 1 minute
- `intensity`: Required, 1-5

**Response (201 Created):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "type": "running",
    "duration": 30,
    "intensity": 4,
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or invalid sport type
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 3. Get All Sport Entries

Get all sport entries for the authenticated user.

**Endpoint:** `GET /api/v1/journal/sport`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 2,
      "customer_id": 1,
      "date": "2025-01-16T00:00:00.000Z",
      "type": "yoga",
      "duration": 45,
      "intensity": 3,
      "created_at": "2025-01-16T11:00:00.000Z"
    },
    {
      "id": 1,
      "customer_id": 1,
      "date": "2025-01-15T00:00:00.000Z",
      "type": "running",
      "duration": 30,
      "intensity": 4,
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** Entries are sorted by date in descending order (most recent first).

---

#### 4. Get Single Sport Entry

Get a specific sport entry by ID.

**Endpoint:** `GET /api/v1/journal/sport/:id`

**Path Parameters:**

- `id` (number) - Sport entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "type": "running",
    "duration": 30,
    "intensity": 4,
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist or doesn't belong to user
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 5. Update Sport Entry

Update an existing sport entry.

**Endpoint:** `PUT /api/v1/journal/sport/:id`

**Path Parameters:**

- `id` (number) - Sport entry ID

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "type": "cycling",
  "duration": 45,
  "intensity": 5
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "type": "cycling",
    "duration": 45,
    "intensity": 5,
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 6. Delete Sport Entry

Delete a sport entry.

**Endpoint:** `DELETE /api/v1/journal/sport/:id`

**Path Parameters:**

- `id` (number) - Sport entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

No response body.

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `401 Unauthorized` - Missing or invalid JWT token

---

### Journal - Meal Entries

Multiple meal entries allowed per day. All fields except `date` are optional.

**Meal Types (Enum):**

- `breakfast`
- `lunch`
- `dinner`
- `snack`

**Date Format:** UTC ISO 8601 format: `"2025-01-15T00:00:00.000Z"`

---

#### 1. Upload Meal Photo

Upload a photo for a meal entry.

**Endpoint:** `POST /api/v1/journal/meal/upload`

**Request Headers:**

```http
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

**Request Body (FormData):**

```
image: File
```

**Accepted Formats:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Maximum File Size:** 10MB

**Response (200 OK):**

```json
{
  "data": {
    "url": "https://yourdomain.com/uploads/meals/abc123.jpg"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file format
- `413 Payload Too Large` - Image exceeds 10MB
- `401 Unauthorized` - Missing or invalid JWT token

**Note:** Frontend compresses images before upload. No server-side compression.

---

#### 2. Create Meal Entry

Create a new meal entry.

**Endpoint:** `POST /api/v1/journal/meal`

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "photo_url": "https://yourdomain.com/uploads/meals/abc123.jpg",
  "food_name": "Oatmeal with berries",
  "note": "Healthy breakfast with oats and berries",
  "meal_type": "breakfast"
}
```

**Validation Rules:**

- `date`: Required, ISO 8601 UTC format
- `photo_url`: Optional, valid URL format
- `food_name`: Optional, max 200 characters - Name/title of the meal
- `note`: Optional, max 500 characters
- `meal_type`: Optional, must be one of predefined enum values

**Response (201 Created):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "photo_url": "https://yourdomain.com/uploads/meals/abc123.jpg",
    "food_name": "Oatmeal with berries",
    "note": "Healthy breakfast with oats and berries",
    "meal_type": "breakfast",
    "created_at": "2025-01-15T08:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or invalid meal type
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 3. Get All Meal Entries

Get all meal entries for the authenticated user.

**Endpoint:** `GET /api/v1/journal/meal`

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 2,
      "customer_id": 1,
      "date": "2025-01-16T00:00:00.000Z",
      "photo_url": "https://yourdomain.com/uploads/meals/def456.jpg",
      "food_name": "Grilled chicken salad",
      "note": "Salad with grilled chicken",
      "meal_type": "lunch",
      "created_at": "2025-01-16T12:30:00.000Z"
    },
    {
      "id": 1,
      "customer_id": 1,
      "date": "2025-01-15T00:00:00.000Z",
      "photo_url": "https://yourdomain.com/uploads/meals/abc123.jpg",
      "food_name": "Oatmeal with berries",
      "note": "Healthy breakfast with oats and berries",
      "meal_type": "breakfast",
      "created_at": "2025-01-15T08:00:00.000Z"
    }
  ]
}
```

**Note:** Entries are sorted by date in descending order (most recent first).

---

#### 4. Get Single Meal Entry

Get a specific meal entry by ID.

**Endpoint:** `GET /api/v1/journal/meal/:id`

**Path Parameters:**

- `id` (number) - Meal entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "photo_url": "https://yourdomain.com/uploads/meals/abc123.jpg",
    "food_name": "Oatmeal with berries",
    "note": "Healthy breakfast with oats and berries",
    "meal_type": "breakfast",
    "created_at": "2025-01-15T08:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist or doesn't belong to user
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 5. Update Meal Entry

Update an existing meal entry.

**Endpoint:** `PUT /api/v1/journal/meal/:id`

**Path Parameters:**

- `id` (number) - Meal entry ID

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body (all fields optional):**

```json
{
  "date": "2025-01-15T00:00:00.000Z",
  "photo_url": "https://yourdomain.com/uploads/meals/new123.jpg",
  "food_name": "Updated meal name",
  "note": "Updated note",
  "meal_type": "brunch"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "customer_id": 1,
    "date": "2025-01-15T00:00:00.000Z",
    "photo_url": "https://yourdomain.com/uploads/meals/new123.jpg",
    "food_name": "Updated meal name",
    "note": "Updated note",
    "meal_type": "brunch",
    "created_at": "2025-01-15T08:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token

---

#### 6. Delete Meal Entry

Delete a meal entry.

**Endpoint:** `DELETE /api/v1/journal/meal/:id`

**Path Parameters:**

- `id` (number) - Meal entry ID

**Request Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

No response body.

**Error Responses:**

- `404 Not Found` - Entry doesn't exist
- `401 Unauthorized` - Missing or invalid JWT token

---

## Date Handling

### UTC Format Requirement

**All dates must be sent in UTC ISO 8601 format:**

```
"2025-01-15T00:00:00.000Z"
```

### Frontend Implementation

The frontend handles timezone conversion:

1. **User selects:** January 15, 2025 (in local timezone)
2. **Frontend converts to UTC:** `"2025-01-15T00:00:00.000Z"`
3. **Backend stores:** `"2025-01-15T00:00:00.000Z"` (UTC)
4. **Backend returns:** `"2025-01-15T00:00:00.000Z"` (UTC)
5. **Frontend displays:** January 15, 2025 (converted to user's local timezone)

**Example:**

```typescript
// User in Paris (GMT+1) selects January 15, 2025
const localDate = new Date(2025, 0, 15) // January 15, 2025 00:00 Paris time

// Frontend converts to UTC
const utcDate = new Date(Date.UTC(2025, 0, 15)) // "2025-01-15T00:00:00.000Z"

// API request body
{
  "date": "2025-01-15T00:00:00.000Z"
}
```

This ensures all dates are normalized to UTC, avoiding timezone ambiguity issues.

---

## TypeScript Types

```typescript
// Authentication
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface RefreshTokenResponse {
  access_token: string;
}

// User
interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  skinType: string | null;
}

// Diagnosis
interface Diagnosis {
  id: number;
  skinType: string;
  concerns: string[];
  createdAt: string; // ISO 8601
  routine: Routine;
}

interface Routine {
  morning: RoutineStep[];
  evening: RoutineStep[];
}

interface RoutineStep {
  id: number;
  order: number;
  productName: string;
  productUrl: string;
  description: string;
}

// Sleep Entry
interface SleepEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC
  hours: number; // 0-24
  quality: number; // 1-5
  created_at: string; // ISO 8601
}

interface CreateSleepEntryDto {
  date: string; // ISO 8601 UTC
  hours: number; // 0-24
  quality: number; // 1-5
}

interface UpdateSleepEntryDto {
  date?: string;
  hours?: number;
  quality?: number;
}

interface SleepUpsertResponse {
  data: SleepEntry;
  created: boolean; // true if new, false if updated
}

// Sport Entry
type SportType =
  | 'yoga'
  | 'cardio'
  | 'swimming'
  | 'running'
  | 'cycling'
  | 'strength'
  | 'pilates'
  | 'hiking'
  | 'dancing'
  | 'other';

interface SportEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC
  type: SportType;
  duration: number; // minutes
  intensity: number; // 1-5
  created_at: string; // ISO 8601
}

interface CreateSportEntryDto {
  date: string; // ISO 8601 UTC
  type: SportType;
  duration: number; // min: 1
  intensity: number; // 1-5
}

interface UpdateSportEntryDto {
  date?: string;
  type?: SportType;
  duration?: number;
  intensity?: number;
}

// Meal Entry
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealEntry {
  id: number;
  customer_id: number;
  date: string; // ISO 8601 UTC
  photo_url: string | null;
  food_name: string | null; // max 200 chars
  note: string | null;
  meal_type: MealType | null;
  created_at: string; // ISO 8601
}

interface CreateMealEntryDto {
  date: string; // ISO 8601 UTC
  photo_url?: string;
  food_name?: string; // max 200 chars
  note?: string;
  meal_type?: MealType;
}

interface UpdateMealEntryDto {
  date?: string;
  photo_url?: string;
  food_name?: string;
  note?: string;
  meal_type?: MealType;
}

interface UploadPhotoResponse {
  url: string;
}

// API Response wrapper
interface ApiResponse<T> {
  data: T;
}
```

---

## Security Notes

1. **API Key Required:** All requests must include `apikey` header
2. **JWT Authentication:** Most endpoints require valid `access_token`
3. **User Isolation:** Users can only access their own data
4. **Token Refresh:** Use refresh token to get new access token when expired
5. **Password Requirements:** Minimum 6 characters (enforced by backend)
6. **HTTPS Only:** Production API must use HTTPS
7. **Request Timeout:** 30-second timeout on all requests

---

## Rate Limiting

_(To be documented when implemented)_

---

## Changelog

### Version 1.0 (2025-01-15)

- Initial API documentation
- Authentication endpoints
- User profile management
- Diagnosis tracking
- Journal entries (sleep, sport, meal)
- Image upload for meals
- UTC date handling
