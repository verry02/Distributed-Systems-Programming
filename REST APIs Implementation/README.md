# Film Manager Service - Exam Call 19/01/2026

## Student Info
* **Name**: [Paola Verrone]
* **Student ID**: [s329489]

## Project Overview
This project is a RESTful web service implementation for the **Film Manager** platform, extended to support the **Review Invitation Acceptance** feature as required by the exam specifications.

The service allows users to manage their film lists, public/private visibility, and handles the complete workflow of review invitations, including expiration and acceptance mechanisms.

## Project Structure
The project follows the standard Node.js/Express architecture provided in Lab01:

* `index.js`: Entry point of the server. Configures middleware, authentication, and routing.
* `openapi.yaml`: The OpenAPI 3.0 specification of the REST APIs.
* `controllers/`: Handles HTTP requests and delegates logic to the service layer.
* `service/`: Contains the business logic and database interactions.
* `components/`: Data models (Classes) for Films, Users, and Reviews.
* `utils/`: Utility functions for writing JSON responses and constants.
* `database/`: Contains the SQLite database file (`database.db`).
* `json_schemas/`: JSON schemas used for request body validation.


## Main Design Choices
* To fulfill the requirements, the `reviews` table and the API logic were extended with two new fields: `invitationStatus` and `expirationDate`.
* The status can be `'pending'`, `'accepted'`or `'expired'`. 
* The system checks for expired invitations ("Lazy Expiration") every time a list of reviews is requested (`getFilmReviews` or `getInvitedFilms`). If an invitation is pending and the current date is past the `expirationDate`, its status is automatically updated to `'expired'`.
* Added optional `status` query parameters to `GET /api/films/public/invited` and `GET /api/films/public/:filmId/reviews` to allow users to filter lists (e.g., view only pending invitations).
* Introduced a new endpoint `POST /api/films/public/invited/acceptance` to allow an invited user to accept all pending invitations in a single operation.
*Self-links have been implemented in the resource representations (Films, Users, Reviews) to adhere to HATEOAS principles, allowing clients to navigate the API resources programmatically.

## How to Run

1.  **Prerequisites**: Ensure Node.js and NPM are installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Database**:
    The project uses the `database/database.db` SQLite file. 
    *Credentials for testing users can be found in `database/password_databases.txt` (if provided).*
4.  **Start Server**:
    ```bash
    node index.js
    ```
    The server will start on **port 3001**.
5.  **Documentation**:
    Swagger UI is available at: `http://localhost:3001/docs`

## API Testing (Postman)

The Postman collection containing the API test examples is located in  Rest afolder.
* **Filename:** `postman_collection.json`

The collection is organized into folders representing the different functional requirements and workflows (Point 1: Review Restriction, Point 2: Issue Invitation with Expiration, Point 3: Owner Visibility & Filter, Point 4: Invitee Retrieve & Accept).






