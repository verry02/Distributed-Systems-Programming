class Review {
    /**
     * Constructor for the Review object.
     * This class acts as a DTO (Data Transfer Object) representing the relationship 
     * between a Film and a User (Reviewer).
     * * It handles the entire lifecycle: Invitation -> Acceptance -> Completion.
     */
    constructor(filmId, reviewerId, completed, reviewDate, rating, review, invitationStatus, expirationDate) {
        
        // --- 1. MANDATORY IDENTIFIERS ---
        // These fields form the composite key of the review.
        // I always need to know WHICH film is being reviewed by WHOM.
        this.filmId = filmId;
        this.reviewerId = reviewerId;

        // --- 2. STATE FLAGS ---
        // Boolean flag indicating if the actual review text has been submitted.
        // false = Invitation phase (pending/accepted)
        // true  = Review phase (completed)
        this.completed = completed;
        
        // --- 3. OPTIONAL CONTENT FIELDS ---
        // These fields are populated only when the review is actually completed.
        // Using 'if' ensures that I don't return null values in the JSON 
        // for pending invitations, keeping the payload clean.
        if (reviewDate) this.reviewDate = reviewDate;
        if (rating) this.rating = rating;
        if (review) this.review = review;
        
        // --- 4. EXTENDED WORKFLOW FIELDS ---
        // These properties were added to support the invitation logic required by the exam.
        
        // Tracks the current state of the invitation (State Machine).
        // Values: 'pending', 'accepted', 'expired'.
        this.invitationStatus = invitationStatus; 

        // Stores the ISO 8601 timestamp for the invitation deadline.
        // Checked by the Service layer to prevent acceptance of expired invitations.
        if (expirationDate) this.expirationDate = expirationDate;

        // --- 5. HATEOAS LINK ---
        // Self-reference link allowing the client to access/modify this specific review resource.
        // Format: /api/films/public/{filmId}/reviews/{reviewerId}
        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self =  selfLink;
    }
}

// Export the class to be able to use it in other files
module.exports = Review;