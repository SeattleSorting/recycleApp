let aboutMe = 'Hello, my name is Hannah. I was born in 1990 in Seattle, WA. I am a code fellows student and TA for current 301 daytime course. I was born in Seattle, WA. I have a newphew who is 3 years old.';


//Q: How many digits appear in the text?
// \d matches digits

let regDigits = /\d/g; 

      // console.log(regDigits.test(aboutMe));
      // console.log(aboutMe.match(regDigits));


//Q: How many non digits?
// \D is the negation of \d

let regNotDigits = /\D/g;

    

//Q: How many alphabet or number characters?
// \w matches characters

let regAlphaNum = /\w/g;

//Q: How many of characters, including spaces?

let regAllCharacters = /./g
 

 //Combining 
 //Q: how many 1 letter words

 let regOneLetter = /\b\w\b/g;
 let regOneLetterDiff = /\s\D\s/g;
  let regOneLetterOther = /\s\w{1}\s/

 //Q: How many two letter words?
  let regTwoLetter = /\s\w{2}\s/


 //What is the difference? 

//Q: How many words?
let regWords = /\b\w+\b/g;
let regWordsDiff = /\b\D+\b/;
let regWordsOther = /b\S+\b/;
let regWordsOneMore = /s\w+\w/;


//Does the word mustache occur in the string? 

let regMustache = /\born/g;
console.log(aboutMe.match(regMustache));


