
//NOTES:
//req.query is multifaceted, often combining multiple parameters, whereas req.param is specific to a single property, often intended to retrieve a single record
//When we make any type of request to the server, Express.js will go through a couple of different phases. First, it'll take the URL we made a request to and check to see if it's one of the URL endpoints we've defined. Once it finds a matching route, it then checks to see the method of the request and determines which callback function to execute.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { animals } = require('./data/animals');

const PORT = process.env.PORT || 3001;
const app = express();

// parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
//The express.urlencoded({extended: true}) method is a method built into Express.js. It takes incoming POST data and converts it to key/value pairings that can be accessed in the req.body object. 
// The extended: true option set inside the method call informs our server that there may be sub-array data nested in it as well, so it needs to look as deep into the POST data as possible to parse all of the data correctly.
// parse incoming JSON data
app.use(express.json()); 
//The express.json() method we used takes incoming POST data in the form of JSON and parses it into the req.body JavaScript object. Both of the above middleware functions need to be set up every time you create a server that's looking to accept POST data.
//First, we used the app.use() method. This is a method executed by our Express.js server that mounts a function to the server that our requests will pass through before getting to the intended endpoint. The functions we can mount to our server are referred to as middleware.

function filterByQuery(query, animalsArray) {
  let personalityTraitsArray = [];
  let filteredResults = animalsArray;
  if (query.personalityTraits) {
    if (typeof query.personalityTraits === 'string') {
      personalityTraitsArray = [query.personalityTraits];
    } else {
      personalityTraitsArray = query.personalityTraits;
    }
    personalityTraitsArray.forEach(trait => {
      filteredResults = filteredResults.filter(
        animal => animal.personalityTraits.indexOf(trait) !== -1
      );
    });
  }
  if (query.diet) {
    filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
  }
  if (query.species) {
    filteredResults = filteredResults.filter(animal => animal.species === query.species);
  }
  if (query.name) {
    filteredResults = filteredResults.filter(animal => animal.name === query.name);
  }
  return filteredResults;
}

function findById(id, animalsArray) {
  const result = animalsArray.filter(animal => animal.id === id)[0];
  return result;
}

function createNewAnimal(body, animalsArray) {
  const animal= body;
  animalsArray.push(animal);
  fs.writeFileSync( //Here, we're using the fs.writeFileSync() method, which is the synchronous version of fs.writeFile() and doesn't require a callback function.
    path.join(_dirname, './data/animals.json'),
    // We want to write to our animals.json file in the data subdirectory, so we use the method path.join() to join the value of __dirname, which represents the directory of the file we execute the code in, with the path to the animals.json file.
    JSON.stringify({ animals: animalsArray}, null, 2)
  );
  // our function's main code will go here!

  // return finished code to post route for response
  return animal;
}
function validateAnimal(animal) {
  if (!animal.name || typeof animal.name !== 'string') {
    return false;
  }
  if (!animal.species || typeof animal.species !== 'string') {
    return false;
  }
  if (!animal.diet || typeof animal.diet !== 'string') {
    return false;
  }
  if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
    return false;
  }
  return true;
}
app.get('/api/animals', (req, res) => {
  let results = animals;
  if (req.query) {
    results = filterByQuery(req.query, results);
  }
  res.json(results);
  //This means when we ask for JSON data using a GET request, our server code uses res.json() to provide context to the client receiving the data, so it knows what type of data to interpret the response as.
  //REWIND:Think back to when we used the response.json() method in the response of a fetch() request. We needed to parse (or convert) the response data to JSON format before we could interface with it.
});
//NOTICE: A param route must come after the other GET route. 
app.get('/api/animals/:id', (req, res) => {
  const result = findById(req.params.id, animals);
  if (result) {
    res.json(result);
  } else {
    //Remember that the 404 status code is meant to communicate to the client that the requested resource could not be found. 
    res.send(404);
  }
});

//POST requests differ from GET requests in that they represent the action of a client requesting the server to accept data rather than vice versa.
app.post('/api/animals', (req, res) => {
  // set id based on what the next index of the array will be
  //Remember, the length property is always going to be one number ahead of the last index of the array so we can avoid any duplicate values.
  req.body.id = animals.length.toString();
// if any data in req.body is incorrect, send 400 error back
if (!validateAnimal(req.body)) {
  res.status(400).send ('The animal is not properly formatted.');
} else {
  const animal= createNewAnimal(req.body, animals);
  res.json(animal);

}
});

app.listen(PORT, () => {
  console.log(`API server now on port ${PORT}!`);
});
