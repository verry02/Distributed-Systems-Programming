class Film{    
    // The constructor is the function called automatically when I write "new Film(...)" in the code.
    // It serves to take raw data from the database and construct a Film object with the correct properties.
    constructor(id, title, owner, privateFilm, watchDate, rating, favorite) {

        // -- OPTIONAL FIELD MANAGEMENT --
        // The ID might not exist (for example, if I am creating a new film that hasn't been saved to the database yet).
        // The if checks: "If 'id' exists and is valid..."
        if(id)
            this.id = id; // ... then create the 'id' property in the Film object

        // -- MANDATORY FIELD MANAGEMENT --
        // These fields must always exist, so there is no need for a check. 
        // They are assigned directly to the Film object (this).
        this.title = title;
        this.owner = owner;
        this.private = privateFilm; // I call it privateFilm to avoid conflicts with the 'private' keyword

        // -- OTHER OPTIONAL PROPERTIES --
        // In the database, watchDate, rating, and favorite can be null.
        // If I wrote "this.rating = rating" and rating was null, the JSON would show "rating": null.
        // I would have {"rating": null}. With the if, if the value is missing, the property is not created.
        if(watchDate)
            this.watchDate = watchDate;
        if(rating)
            this.rating = rating;
        if(favorite)
            this.favorite = favorite;
    
        // --- 4. HATEOAS LINKS ---
        // The server must tell the client where this resource is located.
        // I use the ternary operator ( ? : ) which works like a compact if/else.
        // "If privateFilm is true..." -> The link is /api/films/private/ID
        // "Otherwise..."              -> The link is /api/films/public/ID
        this.self =  (privateFilm? "/api/films/private/" + this.id : "/api/films/public/" + this.id);

        // Only PUBLIC films can have reviews. If the film is public, I add an extra link 
        // which tells the client where to find the reviews for this film.
        if(this.private == false)
            this.reviews = "/api/films/public/" + this.id + "/reviews";
    }
}

// Export the class to be able to use it in other files
module.exports = Film;