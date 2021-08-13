const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const validUrl = require('valid-url');

const INITIAL_URL = process.argv[2];
const SEARCH_WORD = process.argv[3];

if (INITIAL_URL == undefined) {
    return;
}

if (!validUrl.isWebUri(INITIAL_URL)) {
  console.log("Invalid url");
  return;
}

let visited = {};
let visitedCount = 0;
let notVisited = [];
let wordFoundCounter = 0;
const url = new URL(INITIAL_URL);
const baseUrl = url.protocol + "//" + url.hostname;

notVisited.push(INITIAL_URL);
crawl();

function crawl() {
  if (notVisited.length == 0) {
    console.log(visited);
    return;
  }

  var page = notVisited.pop();
  if (page in visited) {
    crawl();
  } else {
    visitPage(page, crawl);
  }
}

function visitPage(url, callback) {
  visited[url] = true;
  visitedCount++;

  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     if (response.statusCode !== 200) {
       callback();
       return;
     }

     const $ = cheerio.load(body);

     if (SEARCH_WORD != undefined) {
        const isWordFound = searchForWord($, SEARCH_WORD);
        if (isWordFound) {
            wordFoundCounter++;
            console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
        }
     }

    collectInternalLinks($);
    callback();
  });
}

function searchForWord($, word) {
  const body = $('html > body').text().toLowerCase();
  return (body.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    let relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        notVisited.push(baseUrl + $(this).attr('href'));
    });

    let absoluteLinks = $("a[href^='http']");
    console.log("Found " + absoluteLinks.length + " absolute links on page");
    absoluteLinks.each(function() {
        const absoluteLink = $(this).attr('href');
        const absoluteUrl = new URL(absoluteLink);       
        
        if (absoluteUrl.hostname === url.hostname) {
            notVisited.push(absoluteLink);
        }
    });
}