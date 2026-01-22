//this file is used to standardize server responses.
// Rather than writing response code and headers in each controller,



/**
  class container (Wrapper).
  It is used to package together the CODE (e.g. 404) and the DATA (e.g. "Not Found").
  Services can return this object if they want to decide the status code themselves.
  @param {number} code - HTTP status code
  @param {any} payload - Data to be sent in the response
 */
var ResponsePayload = function(code, payload) {
  this.code = code;
  this.payload = payload;
}


/**
  this function is an helper to easily create a new ResponsePayload.
  @param {number} code - HTTP status code
  @param {any} payload - Data to be sent in the response
  @returns {ResponsePayload} 
  Example: exports.respondWithCode(404, { message: "Not Found" });
 */
exports.respondWithCode = function(code, payload) {
  return new ResponsePayload(code, payload);
}


/**
  Function that is caled to write JSON responses in controllers.
  It is "polymorphic", meaning it tries to guess what the arguments are
  based on what I pass to it.
  * It can be called in various ways:
  1. writeJson(res, payload, 200)     -> Data + Explicit Code
  2. writeJson(res, payload)          -> Only data (code defaults to 200)
  3. writeJson(res, 404)              -> Only code (empty payload)
  4. writeJson(res, responsePayload)  -> pass the wrapper object defined above
  @param {object} response - The HTTP response object
  @param {any} arg1 - Either the payload or the code or a ResponsePayload object
  @param {number} [arg2] - (Optional) The HTTP status code
 */
var writeJson = exports.writeJson = function(response, arg1, arg2) {
  var code;
  var payload;

  // --- 1. the argument is a ResponsePayload object ---
  //if the first argument is an instance of ResponsePayload,
  // we "unpack" it and call ourselves recursively.
  if(arg1 && arg1 instanceof ResponsePayload) {
    writeJson(response, arg1.payload, arg1.code);
    return; // Exit the function early
  }

  // --- 2. logic to guess arguments ---
  //if the second argument exists and is a number, it's the HTTP code.
  if(arg2 && Number.isInteger(arg2)) {
    code = arg2; //  HTTP code
  }
  else {
    // if the second argument is NOT a number, check the first.
    if(arg1 && Number.isInteger(arg1)) {
      code = arg1; //  HTTP code
    }
  }
  //now, we assign the payload based on what we found above.
  if(code && arg1) {
    // if we found a code and there's also arg1...
    payload = arg1; // arg1 is the payload
  }
  else if(arg1) {
    // if we didn't find a code, but there's arg1...
    payload = arg1; // arg1 is the payload
  }

  // --- DEFAULT ---
  // If we don't have a payload, default to empty string.

  if(!code) {
    code = 200; // Default HTTP code, it's all OK.
  }

  //--- JSON SERIALIZATION ---
  //if the payload is a javaScript object, we need to convert it to a JSON string.
  if(typeof payload === 'object') {
    payload = JSON.stringify(payload, null, 2);
  }

  // --- SEND RESPONSE ---
  //write the response headers and payload.
  response.writeHead(code, {'Content-Type': 'application/json'});
  //close the connection and send the data.
  response.end(payload);
}