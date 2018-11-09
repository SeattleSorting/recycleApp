'use strict';
let subCatBool = false;
// global category variable
var categoryStorage = []; //this needs to be reset/reassigned otherwise new searches don't work

// create global variable with correct categories
const categories = ['PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ELECTRONIC', 'FOOD'];

//brings in modules
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
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
app.use(fileUpload());

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


app.post('/search-item', getSearchItem);

//sets the path for vision when the server hears the /vision it will call the getGoogleVision function

// Vision function

app.post('/vision', getGoogleVision);

//middleware connections to front end
app.get('/', helloWorld);

//path for imaage upload
app.post('/upload', uploadPage);

// app.post('/imageCheck', verifyItem)

// Get user location then render the material category page
app.post('/location', getLocation);

//Get item material then render subcategory page
app.post('/item-categories', getCategory);

//query earth911 to get recycle instructions
app.post('/disposal-instructions', getInstructions);

//listen for user to select sub-category, then call
app.post('/choose-sub-cat', subCategory);

function subCategory(req, res){
  subCatBool = true;
  let subCat= req.body.item;
  let _subSQL = `
    SELECT * FROM recyclables
    WHERE subcategory = '${subCat}'`;

  console.log('the sub category is: ', subCat);


  client.query(_subSQL)
    .then( subResults => {
      let specificItems = [];
      for( let i = 0; i< subResults.rows.length; i++){
        specificItems.push(subResults.rows[i]);
      }
      // console.log(specificItems);
      // console.log('this is our results array: ', resultsArr);
      res.render('./pages/subcat.ejs', {items: specificItems});
    }).catch(console.error('error'));

}

//render all the specific items in the selected category or subcategory
function getInstructions(req, res){
  let _getSQL = `
    SELECT * FROM recyclables
    WHERE category = '${categoryStorage[0]}'
    AND item_name = '${req.body.item}'`;

  console.log('this is our req.body from subcat', req.body);
  // console.log('this is our categoryStorage at idx 0: ', categoryStorage[0]);

  client.query(_getSQL)
    .then( results => {
      // console.log('this is our result object w/ instructions', results);
      let finalResult = results.rows[0];
      // console.log('this is our finalResult: ', finalResult);
      let resultsArr = [];
      let detailArr=[];
      let resultKeys = Object.keys(finalResult);
      // console.log('this is resultKeys: ', resultKeys);
      resultsArr.push(finalResult.item_name);
      resultsArr.push(finalResult.category);
      // console.log('results arry before loop : ', resultsArr);

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
  // using req.body, load object into res.render
  let categoryName = req.body.category;
  categoryStorage.push(categoryName);
  const _getSubCatItems = `
  SELECT * FROM recyclables
  WHERE category = '${categoryName}'`;

  client.query(_getSubCatItems)
    .then(subCatItems => {
      console.log('getCategory client returns: ', subCatItems.rows[0].subcategory);
      if(subCatItems.rows[0].subcategory){
        let subCategoryArr = [];
        subCatItems.rows.forEach((item)=>{
          if(!subCategoryArr.includes(item.subcategory) && item.subcategory !== null){
            subCategoryArr.push(item.subcategory);
          }
        });
        console.log('the array of subcategories', subCategoryArr);
        res.render('./pages/material-subcat.ejs', {subCatArr: subCategoryArr, matSubCat: subCatItems.rows})
      }
      else{
        const specificItems = subCatItems.rows;
        // console.log('trying to get the item name: ', subCatItems.rows)
        res.render('./pages/subcat.ejs', {items:specificItems});
      }

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
  plasticData.allItemObjects.forEach( item => {
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
//receives dom object from vision path


  // let imagePath = req.body

  // console.log('this is being called from getGoogleVision function ',req.files.file, req.body)
  //path for image
  const img_url = './public/data-set/'+req.files.file.name;
  // console.log(img_url)
  //gets label info on image
  let visionDescriptions = [];
  visionClient.labelDetection(img_url)
    .then(results => {
      results[0].labelAnnotations.forEach(result => {
        // console.log(result.description);
        visionDescriptions.push(result.description);
      });
      // console.log(visionDescriptions);
      // make function pass in vision description
      queryWithVisionResults(visionDescriptions, req.files.file.name, res)
    }).catch(err => {
      console.log(err)});
}

function uploadPage(req, res) {
  res.render('./pages/upload.ejs');
}


function getSearchItem(req, res){

  console.log('item searched: ', req.body);
  let SQL = `SELECT * FROM recyclables 
              WHERE item_name='${req.body.search}'`;

  return client.query(SQL)
    .then( results => {
    // console.log('this is our result object w/ instructions', results);
      let finalResult = results.rows[0];
      // console.log('this is our finalResult: ', finalResult);
      let resultsArr = [];
      let detailArr=[];
      let resultKeys = Object.keys(finalResult);
      // console.log('this is resultKeys: ', resultKeys);
      resultsArr.push(finalResult.item_name);
      resultsArr.push(finalResult.category);
      // console.log('results arry before loop : ', resultsArr);

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
      res.render('./pages/result.ejs', {destination: resultsArr, details: detailArr});
    }).catch(console.error('error'));


  // .then(searchResult=>{
  //   let mySearch = {item: searchResult.rows[0].item_name};

  //   console.log('result rows: ', searchResult.rows);
  //   getInstructions(mySearch, res);
  // }).catch(console.error('error'));

// this takes in Google vision array results and queries database
function queryWithVisionResults(visionArr, fileName, res) {

  let concatStrWithS = '';
  for(let i = 0; i < visionArr.length-1; i++){
    concatStrWithS += `'${visionArr[i]}s', `
  }
  concatStrWithS += `'${visionArr[visionArr.length-1]}s'`;

  let concatStr = '';
  for(let i = 0; i < visionArr.length-1; i++){
    concatStr += `'${visionArr[i]}', `
  }
  concatStr += `'${visionArr[visionArr.length-1]}'`;

  // console.log('this is our concatenatedStr: ', concatStr);
  // console.log('this is our concatenatedStrWithS: ', concatStrWithS);
  let _exactMatchSQL = `SELECT * FROM recyclables WHERE LOWER(item_name) IN (${concatStrWithS})`;
  client.query(_exactMatchSQL)
    .then( result => {
        if (result.rows[0]){
          console.log('inside if statement... legooo');
          console.log('file name data: ', fileName)
          console.log('result.rows data inside if statement ', result.rows[0])
          res.render('./pages/varification.ejs', {file: fileName, verifiedItem: result.rows[0]} );
        }
      }).catch(err => {
        console.log(err)});
}
