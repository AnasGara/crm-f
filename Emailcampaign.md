
# Email Campaign API Integration Documentation

This document outlines the current status of the Email Campaign API integration, including what is working, what is not, and the requirements from the backend to make it fully functional.

## What is Working

### 1. Google Account Integration

- **Connection Status:** The frontend correctly checks if a Google account is connected using the `GET /api/user/email-provider` endpoint.
- **Connect/Disconnect:** The UI provides buttons to initiate the Google OAuth 2.0 flow and to disconnect an existing connection.
  - The "Connect" button redirects the user to `http://<your-app-url>/email-provider/google/redirect`.
  - The "Disconnect" button successfully calls the `DELETE /api/user/email-provider` endpoint.
- **UI Feedback:** The component displays the current connection status to the user.

### 2. Email Campaign Creation

- **Campaign Form:** A form is available to create a new email campaign, allowing the user to input the campaign name, subject, audience, and content.
- **Scheduling:** The form supports scheduling the campaign to be sent immediately ("now") or at a later time ("later").
  - A datetime picker is displayed when "later" is selected.
- **API Call:** The form successfully sends a `POST` request to `/api/email-campaigns` with the campaign data.

## What is Not Working or Needs Improvement

### 1. User Experience

- **Error Handling:** While basic error messages are displayed, more specific and user-friendly error handling is needed. For example, if the campaign creation fails due to invalid data, the backend should return detailed error messages that can be displayed to the user.
- **Loading States:** More comprehensive loading indicators are needed to provide better feedback to the user during API calls.
- **Hardcoded Sender ID:** The `sender` ID is currently hardcoded to `123`. This needs to be replaced with the actual ID of the authenticated user.

### 2. Missing Features

- **Audience Selection:** The audience is currently entered as a comma-separated list of user IDs. A user-friendly audience selection mechanism (e.g., a multi-select dropdown or a contact picker) is required.
- **Campaign Management:** There is no interface to view, edit, or delete existing email campaigns.
- **Analytics:** No analytics are available to track the performance of the campaigns (e.g., open rates, click rates).

## What We Need from the Backend

### 1. User Authentication

- **Authenticated User ID:** The frontend needs a reliable way to get the ID of the currently authenticated user to use as the `sender` ID when creating a campaign.

### 2. Enhanced API Responses

- **Detailed Error Messages:** The backend should provide detailed error messages for failed API requests. For example, if a scheduled time is in the past, the API should return a specific error message.
- **Validation Errors:** For validation errors (e.g., invalid email format in the audience), the API should return a `422 Unprocessable Entity` response with a list of errors.

### 3. Additional Endpoints

- **List Campaigns:** An endpoint to retrieve a list of all email campaigns created by the user.
- **Get Campaign:** An endpoint to retrieve the details of a single email campaign.
- **Update Campaign:** An endpoint to update an existing email campaign.
- **Delete Campaign:** An endpoint to delete an email campaign.
- **Audience Data:** An endpoint to fetch a list of users or contacts that can be used for audience selection.
