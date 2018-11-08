'use strict';

// global category variable
const categoryStorage = [];


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

app.listen(PORT, () => console.log(`App is up on port ${PORT}`));


// pg middleware setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

// Express setup
app.use(cors());

const vision = require('@google-cloud/vision');

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

//sets the path for vision when the server hears the /vision it will call the getGoogleVision function
app.get('/vision', getGoogleVision);

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
  console.log('this is our req.body from subcat', req.body);
  console.log('this is our categoryStorage at idx 0: ', categoryStorage[0]);
  const _getInstructions = `
  SELECT * FROM recyclables
  WHERE category = '${categoryStorage[0]}'
  AND item_name = '${req.body.item}'`;
  client.query(_getInstructions)

    .then( results => {
      // console.log('this is our result object w/ instructions', results);
      let finalResult = results.rows[0];
      console.log('this is our finalResult: ', finalResult);
      let resultsArr = [];
      let resultKeys = Object.keys(finalResult);
      console.log('this is resultKeys: ', resultKeys);
      resultKeys.forEach( (key, idx) => {
        if(finalResult[key] && finalResult[key] === 'true'){
          resultsArr.push(resultKeys[idx]);
        }
      });
      console.log('this is our results array: ', resultsArr);

    }).catch(console.error('error'))
  
    // TO DO: throw resultsArr into res.render below, populate via results data. 

  res.render('./pages/result.ejs');
}

function getCategory(req, res){
  // using req.body, load object into res.render
  let categoryName = req.body.category;
  categoryStorage.push(categoryName);
  const _getSubCatItems = `
  SELECT * FROM recyclables
  WHERE category = '${categoryName}'`;

  client.query(_getSubCatItems)
    .then(subCatItems => {
      const specificItems = subCatItems.rows;
      res.render('./pages/subcat.ejs', {items:specificItems});
    }).catch(console.error('error'))
}

function getLocation(req, res){
  res.render('./pages/categories.ejs');
}


// This retrieves and returns data from the Google Books API.
function helloWorld(req, res) {
  res.render('index.ejs');
  checkDatabase();
}

function checkDatabase(){
  const SQL = `SELECT * FROM recyclables`;
  return client.query(SQL)
    .then(result => {
      if(result.rows < 1){
        seedDatabase();
      }
    }).catch(console.error('error'));
}


function seedDatabase() {
  const plasticData = require('./public/js/items.json');
  plasticData.allItems.forEach( item => {
    let newItem = new Item(item);
    newItem.save();
  })
}



Item.prototype.save = function(){
  let SQL = `
  INSERT INTO recyclables
    (item_name,category,subcategory,garbage,recycling,yard,reuse,hazard,waste_transfer,binside)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;

  let values = Object.values(this);
  return client.query(SQL, values);
};


function Item(item) {
  this.item_name = item.itemName;
  this.category = item.category;
  this.subcategory = item.subcategory;
  this.garbage = item.destination.garbage;
  this.recycling = item.destination.recycling;
  this.yard = item.destination.yard;
  this.reuse = item.destination.reuse;
  this.hazard = item.destination.hazard;
  this.transfer = item.destination.transfer;
  this.binside = item.destination.binside;
}


// google vision api functions and variables
const visionClient = new vision.ImageAnnotatorClient({

  //taken from the jason file
  projectId: '1540239667572',
  keyFilename: 'vision-api.json'
})



function getGoogleVision(req, res) {
  //path for image
  const img_url = 'data-set/glass-cup.jpg'; //path for image
  //gets label info on image
  visionClient.labelDetection(img_url)
    .then(results => {
      console.log(results[0]);
    })
    .catch(err => {
      console.log(err);
    });
}

