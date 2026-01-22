class FilmManager{    
    // This file represents the Main Map (or table of contents) of the application.
    // It serves to implement the concept of a Root Endpoint (entry point). When a client calls 
    // the base address /api, it receives this JSON object. Thanks to this object, the client knows 
    // which URL addresses exist in the system without having to guess them.


    constructor() {
        
        // To manage films in general
        this.films = "/api/films/";

        // To manage private films
        this.privateFilms = "/api/films/private/";

        // To manage public films visible to everyone
        this.publicFilms = "/api/films/public/";

        // To manage the public films the user has been invited to review
        this.invitedPublicFilms = "/api/films/public/invited";

        // To manage the automatic assignment of reviews
        this.reviewAssignments = "/api/films/public/assignments";

        // To manage the list of users
        this.users = "/api/users/";

        // The gateway for performing Login/Logout (the authenticator)
        this.usersAuthenticator = "/api/users/authenticator";
    }
}

module.exports = FilmManager;