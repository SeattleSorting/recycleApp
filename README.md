# recycleApp


#Names of the team members
Kevin Rosales, Derrin Howell, Jonathan DiQuattro and Hanna Ingham.

#Description
recycleApp is a web application that utilizes RESTful API's to allow users the ability to upload an image of any item they wish to recycle and provides amplifying information about how to dispose of that item. This is accomplished through the google vision ML API. which can recognize millions of items.


#Why we made recycleApp
There are a lot of rules for recycling and often times people who wish to recycle find the rules complicating and hard to interpret. That is why team Velma set out to make a web application that takes the guessing out of recycling.


#Current version:
V1.0.0 allows users to upload images and query the google vision API.
V1.0.1 coming soon!


#The recycleApp uses the following libraries and packets:
@google-cloud/datastore: 2.0.0
@google-cloud/storage: 2.3.0
@google-cloud/vision: 0.22.1
cors: 2.8.5
dotenv: 6.1.0
ejs: 2.6.1
express: 4.16.4
express-fileupload: 1.0.0
method-override: 3.0.0
pg: 7.6.0
superagent: 4.0.0-beta.5


#How to access and use the recycleApp
To use recycleApp, simply visit: https://anti-trash.herokuapp.com/ on your mobile device!


#API Requests and responses
The data required from google vision is a label with the name of the item in the image and should look like this:
{
  "responses": [
    {
      "labelAnnotations": [
        {
          "mid": "/m/0h8lhng",
          "description": "household paper product",
          "score": 0.5351178,
          "topicality": 0.5351178
        }
      ]
    }
  ]
}
our application then uses the description label to identify what is in the image.


#Database Schema for V1.0.0
CREATE TABLE recyclables (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    garbage VARCHAR(255),
    recycling VARCHAR(255),
    yard VARCHAR(255),
    reuse VARCHAR(255),
    hazard VARCHAR(255),
    waste_transfer VARCHAR(255),
    binside VARCHAR(255),
    tips VARCHAR(255)
);