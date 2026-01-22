class User{    

    //-- CONSTRUCTOR --
     // The function that constructs the User object.

    constructor(id, name, email, hash) {
        
        // --- 1. ID MANAGEMENT (Optional) ---
        // If I am creating a NEW user to save in the database, 
        // the ID does not exist yet (SQLite creates it later). 
        // If instead I am reading an EXISTING user, the ID is present.
        if(id)
            this.id = id;

        // --- 2. MANDATORY DATA ---
        this.name = name;
        this.email = email;
        
        // --- 3. PASSWORD MANAGEMENT (HASH) ---
        // If I am using this object for Login (inside Passport), I need the hash to verify the password.
        // If I am sending the user list to the Frontend, I do NOT want to send the hash (it would be a risk).
        // This "if" allows creating the object with or without the hash depending on the need.
        if(hash)
            this.hash = hash;

        // --- 4. HATEOAS LINKS ---
        // I construct the URL where details of THIS specific user can be found.
        // Matches the route defined in OpenAPI: /api/users/{userId}
        var selfLink = "/api/users/" + this.id;
        
        // I assign the link to the .self property
        // The client (Postman/Frontend) will receive: { "id": 1, "name": "user", "self": "/api/users/1" }
        this.self =  selfLink;
    }
}

// Export the class to be able to use it in Services or in Passport.
module.exports = User;