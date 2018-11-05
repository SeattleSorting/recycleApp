'use strict';


//brings in modules
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const ejs = require('ejs');
const bodyParser = require('body-parser');

const methodoverride = require('method-override');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();


// pg middleware setup
// const client = new pg.Client(process.env.DATABASE_URL);
// client.connect();
// client.on('err', err => console.log(err));

// Express setup
app.use(cors());

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(methodoverride((req, res)=>{
  if(typeof (req.body)==='object' && '_method' in req.body ){
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


//middleware connections to front end
app.get('/', helloWorld);


// Get user location then render the material category page
app.post('/location', getLocation);

//Get item material then render subcategory page
app.post('/item-categories', getCategory);

//query earth911 to get recycle instructions
app.post('/disposal-instructions', getInstructions);


function getInstructions(req, res){
  //update the sql table
  //make a superagent request with req.body data
  
  res.render('./pages/result.ejs');
}

function getCategory(req, res){
  //console.log(req.body);
  //using req.body, load object into res.render
  res.render('./pages/subcat.ejs');
}

function getLocation(req, res){
  res.render('./pages/categories.ejs');
}

// app.post('/search', fetchBooksAPI);



// app.post('/view', viewBookDetail);
// app.post('/update', updateBook) 

// app.post('/save', saveBook);

// app.post('/delete', deleteBook);

// This retrieves and returns data from the Google Books API.
function helloWorld(req, res) {

  res.render('index.ejs');

}




app.listen(PORT, () => console.log(`App is up on port ${PORT}`));
