'use strict';


let subCatBool = false;
// global category variable
var categoryStorage = []; //this needs to be reset/reassigned otherwise new searches don't work
var allItems = [];
// create global variable with correct categories
const categories = ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'FOOD'];

//brings in modules
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const methodoverride = require('method-override');
const multer = require('multer');
let upload = multer({dest: 'public/uploads/'});
// const fuzzyset = require('fuzzyset')
const fuzzy = require('fuzzy')

// console.log(fuzzyset);
console.log(fuzzy);




var results = fuzzy.filter('pizza', ['pizza boxes'])
// console.log('string searched', str.toLowerCase());
var matches = results.map(function(el) {
  return el;
});
console.log('matches', matches);




require('dotenv').config();

const vision = require('@google-cloud/vision');

fs.writeFileSync('new-vision-api.json', process.env.GOOGLE_CONFIG);

const visionClient = new vision.ImageAnnotatorClient({

  //taken from the jason file
  projectId: 'seattle-sort',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
})




const PORT = process.env.PORT || 5000;
const app = express();

app.listen(PORT, () => console.log(`App is up on port ${PORT}`));


// pg middleware setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

// Express setup
app.use(cors());
// app.use(fileUpload());

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.post('/search-item', getSearchItem);

app.post('/vision', upload.single('img-file'), getGoogleVision);

//middleware connections to front end
app.get('/', helloWorld);

//path for image upload
app.post('/upload', uploadPage);

// Get user location then render the material category page
app.post('/show-categories', getCategorySearch);

//Get item material then render subcategory page
app.post('/item-categories', getCategory);

//query earth911 to get recycle instructions
app.post('/disposal-instructions', getInstructions);

//listen for user to select sub-category, then call
app.post('/choose-sub-cat', subCategory);

app.post('/thank-you', getThankYou);

function subCategory(req, res){
  subCatBool = true;
  let subCat= req.body.item;
  let _subSQL = `
    SELECT * FROM recyclables
    WHERE subcategory = '${subCat}'`;

  client.query(_subSQL)
    .then( subResults => {
      let specificItems = [];
      for( let i = 0; i< subResults.rows.length; i++){
        specificItems.push(subResults.rows[i]);
      }
      res.render('./pages/item-list.ejs', {items: specificItems});
    }).catch(console.error('error'));

}

//render all the specific items in the selected category or subcategory
function getInstructions(req, res){
  let _getSQL = `
    SELECT * FROM recyclables
    WHERE LOWER(item_name) = '${req.body.item}'`;

  console.log('this is our req.body from subcat', req.body);

  client.query(_getSQL)
    .then( results => {
      console.log('results from getInstrcutions, ', results.body)
      let finalResult = results.rows[0];
      let resultsArr = [];
      let detailArr=[];
      let resultKeys = Object.keys(finalResult);
      resultsArr.push(finalResult.item_name);
      resultsArr.push(finalResult.category);

      resultKeys.forEach( (key, idx) => {
        // && finalResult[key] === 'true'
        if(idx>3){
          if(finalResult[key]){
            resultsArr.push(resultKeys[idx]);
            if(typeof(finalResult[key])==='string'){
              detailArr.push(finalResult[key]);
            }
          }
        }

      });

      console.log('this is our results array: ', resultsArr, detailArr);
      categoryStorage = [];
      res.render('./pages/result.ejs', {destination: resultsArr, details: detailArr});

    }).catch(console.error('error'));

  // TO DO: throw resultsArr into res.render below, populate via results data.

}


//if there is something in subcategories for item, render material-subcat page
//else, go directly to subcat.ejs page
function getCategory(req, res){
  let categoryName = req.body.category;
  categoryStorage.push(categoryName);

  const _getSubCatItems = `
  SELECT * FROM recyclables
  WHERE category = '${categoryName}'`;

  client.query(_getSubCatItems)
    .then(items => {
      console.log('getCategory client returns: ', items.rows[0].subcategory);
      if(items.rows[0].subcategory){
        let subCategoryArr = [];
        items.rows.forEach((item)=>{
          if(!subCategoryArr.includes(item.subcategory) && item.subcategory !== null){
            subCategoryArr.push(item.subcategory);
          }
        });
        console.log('the array of subcategories', subCategoryArr);
        res.render('./pages/material-subcat.ejs', {subCatArr: subCategoryArr, matSubCat: items.rows})
      }
      else{
        const specificItems = items.rows;
        res.render('./pages/item-list.ejs', {items:specificItems});
      }

    }).catch(console.error('error'))
}

function getCategorySearch(req, res){
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
      if(allItems.length <1){
        fillAllItems();
      }
    }).catch(console.error('error'));
}

function fillAllItems(){
  let jsonItems = require('./public/js/new-items.json');
  jsonItems.allItemObjects.forEach( item =>{
    allItems.push(item.itemName.toLowerCase());
  })
}


function seedDatabase() {
  let jsonItems = require('./public/js/new-items.json');
  jsonItems.allItemObjects.forEach( item => {
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


function getGoogleVision(req, res) {
  console.log(req.file, req.file.path);

  let gAllResults = [];

  const img = req.file.path;

  let visionDescriptions = [];
  visionClient.labelDetection(img)
    .then(results => {
      results[0].labelAnnotations.forEach(result => {
        visionDescriptions.push(result.description);
      });
      console.log('vision array: ', visionDescriptions );

      if (visionDescriptions.length > 0){

        //run the fuzzySearch for the first 3 results
        //fuzzySearch will find the match in the itemArray (get three matches)
        //use the match returned from the search to query the database

        for(let i = 0; i<1; i++){
          //assign match array to gFuzzy Match
          gAllResults = gAllResults.concat(fuzzySearch(visionDescriptions[i])); //array of all the matches from i
          console.log('allResults: ', gAllResults) ;
        }
        res.render('./pages/verification.ejs', {file: img.slice(6, img.length), itemMatches: gAllResults})
      }

      else {
        res.render('./pages/verification.ejs', {file: img.slice(6,img.length), itemMatches: 'No Match'});
      }
    });
   
}
//   else if(fuzzyMatch.length>1){
//     let gfuzzyItemArr = gfuzzyMatch.map(matches=>{
//       return {item_name: matches.string};
//     })
//   }
// let SQL = `SELECT * FROM recyclables`;


// let SQL = `SELECT item_name FROM recyclables
// WHERE LOWER(item_name)='${gFuzzyMatch[0].string}'`;


//     client.query(SQL)
//       .then(results=>{
//         console.log(results.rows[0]);
//         results.rows.forEach(item=>{
//           if(visionDescriptions.includes(item.item_name.toLowerCase())){
//             console.log('inside if vertiication');
//             res.render('./pages/verification.ejs', {file: img.slice(6, img.length), itemMatches: item.item_name});
//           }
//         })
//         console.log('inside of else verfication')
//         res.render('./pages/verification.ejs', {file: img.slice(6,img.length), itemMatches: 'No Match'});
//       })
//   }
// }).catch(err => {
//   console.log(err)});


function uploadPage(req, res) {
  res.render('./pages/upload.ejs');
}


function getSearchItem(req, res){
  console.log('results, ', req.body.search);
  let SQL = '';
  if (req.body.search.length > 0) {
    console.log('fuzzy search function: ', fuzzySearch(req.body.search));
    let fuzzyMatch = fuzzySearch(req.body.search);
    if(fuzzyMatch.length===1){
      console.log('item searched: ', req.body);
      SQL = `SELECT * FROM recyclables 
                  WHERE LOWER(item_name)='${fuzzyMatch[0].string}'`;
    }

    else if(fuzzyMatch.length>1){
      let fuzzyItemArr = fuzzyMatch.map(matches=>{
        return {item_name: matches.string};
      })
      res.render('./pages/item-list.ejs', {items: fuzzyItemArr});
    }

  }
  else{
    console.log('item searched: ', req.body);
    SQL = `SELECT * FROM recyclables 
                WHERE item_name='${req.body.search}'`;
  }


  return client.query(SQL)
    .then( results => {
      // console.log('results, ', results.body);
      if(results.rows < 1){
        res.render('./pages/error');
      }
      const match = results.rows[0];
      console.log('match: ', match)
      let resultsArr = [];
      let detailArr=[];
      let resultKeys = Object.keys(match);

      resultsArr.push(match.item_name);
      resultsArr.push(match.category);

      resultKeys.forEach( (key, idx) => {
        if(idx>3){
          if(match[key]){
            resultsArr.push(resultKeys[idx]);
            if(typeof(match[key])==='string'){
              detailArr.push(match[key]);
            }
          }
        }

      });
      console.log('this is our results array: ', resultsArr, detailArr);
      res.render('./pages/result.ejs', {destination: resultsArr, details: detailArr});
    }).catch(console.error('error'));
}


function fuzzySearch(str){
  //use array allItems
  // var list = ['baconing', 'narwhal', 'a mighty bear canoe'];
  // console.log(allItems);
  var results = fuzzy.filter(str, allItems)
  console.log('string searched', str.toLowerCase());
  var matches = results.map(function(el) {
    console.log('found: ', el)
    return el;
  });
  console.log('matches', matches);

  // console.log(matches[0], matches[0].string);
  return matches;
}



function getThankYou(req, res){
  res.render('./pages/thanks.ejs');
}
