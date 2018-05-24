const url = require('url')
const fs = require('fs');
const request = require('request');
const async = require('async');
const read = require('node-readability');
const cheerio = require('cheerio');
const slug = require('slug');

const lib = require('./lib');
const db = require('./schema');
const articleModel = db.model('article');


const urlMap = JSON.parse(fs.readFileSync('urlMap.json', 'utf8'));
db.connection.on("open",function(err) {
  const urlCount = urlMap[process.argv[2]].length;
  let urlIndex = 0;
  let bulkCache = [];
  const bulk = articleModel.collection.initializeOrderedBulkOp();
  async function fetchArticle(articleURL) {
    return await new Promise((resolve, reject) => {
      lib.getWebpage(articleURL, (err, body) => {
        if (!err) {
          let headlineImage = null;
          let icon = null;
          try {
            const $ = cheerio.load(body);
            if ($("meta[property='og:type']").attr('content') != "article") {
              console.log("NOT AN ARTICLE: "+articleURL);
              return resolve(false);
            }

            const icons = $("link[rel='apple-touch-icon']");
            icon = $(icons[icons.length-1]).attr('href'); // get largest size
            if (!icon) {
              icon = $("link[rel='shortcut icon']").attr('href');
            }
            if (icon && icon.indexOf("//") == 0) {
              icon = `http:${icon}`;
            } else if (icon && icon.indexOf("/") == 0) {
              icon = `http://${url.parse(articleURL).hostname}${icon}`;
            }  

            headlineImage = $("meta[property='og:image']").attr('content');
            if (!headlineImage) {
              headlineImage = $("meta[name='twitter:image']").attr('content');
            }
          } catch (e) {
            console.log(e);
            return resolve(false); // using resolve everywhere
          }
          
          try {
            read(body, (err, article, meta) => {
              if (err) {
                console.log(err);
                return resolve(false);
              };
              if (article.title && article.content) {
                if (article.title.split(" ").length < 3) {
                  console.log("Title too short", article.title);
                  return resolve(false);
                }
                let pubSlug = slug(process.argv[2]+" "+article.title);
                
                // console.log("->Saving "+articleURL);
                // instead of checking here check a redis map of all the article urls in generateURLList
                urlIndex++;
                if (bulkCache.indexOf(pubSlug) > -1) {
                  return resolve(false);
                }
                
                bulkCache.push(pubSlug); 
                console.log("->Inserting "+articleURL, "("+urlIndex + " / " + urlCount+")");
                const previewCheerio = cheerio.load(article.content);
                const articlePreview = previewCheerio.html().split(' ').slice(0,50);

                bulk.insert({
                  title: article.title,
                  content: article.content,
                  origin: articleURL,
                  publication: process.argv[2],
                  publicationSlug: pubSlug,
                  headlineImage,
                  date_scrapped: parseInt(process.argv[3]),
                  trained: false,
                  icon,
                  articlePreview
                });  
                article.close(); 
                resolve(true);      
              } else {
                resolve(false);
              };
            });    
          } catch (e) {
            console.log("readability error:",e);
            resolve();
          }          
        } else {
          console.log("Fetch Error:", err);
          resolve();
        }        
      });
    });
  }

  const callbackWait = (articleURL, articleCallback) => {
    async function run(articleURL, articleCallback) {
      const result = await fetchArticle(articleURL);
      articleCallback()
    }
    run(articleURL, articleCallback);
  }
  
  async.each(urlMap[process.argv[2]], callbackWait, (err) => {
    if (err) {
      console.log("BULK INSERT ERROR:", err)
    }
    console.log("* Source processed "+process.argv[2]);
    
    if(bulk && bulk.s && bulk.s.currentBatch 
      && bulk.s.currentBatch.operations 
      && bulk.s.currentBatch.operations.length > 0){
      bulk.execute({wtimeout: 5000}, (err, result) => {
        if (err) console.log(err);
        if (result) 
          console.log("INSERTED: "+result.nInserted);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
    
  });

});

process.on('uncaughtException', (err) => {
  console.log(`Caught exception in ${process.argv[2]}: ${err}\n`);
  process.exit(1);
});
