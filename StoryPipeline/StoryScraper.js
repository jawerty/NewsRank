const fs = require('fs');
const { spawn } = require('child_process');
const url = require('url');
const async = require('async');
const cheerio = require('cheerio');
const slug = require('slug');
const lib = require('./lib');

const db = require('../db/schema');
const articleModel = db.model('article');

require('events').EventEmitter.defaultMaxListeners = 0

const getUniqueURLs = (urlMap, callback) => {
  const sources = Object.keys(urlMap);
  const resultURLMap = {};
  async.each(sources, (source, sourceCallback) => {
    console.log("Filtering unique urls for "+source);
    const urlList = [];
    async.each(urlMap[source], (articleURL, articleCallback) => {
      articleModel.findOne({origin: articleURL}, (err, foundArticle) => {
        if (!foundArticle) {
          urlList.push(articleURL);
        } else {
          console.log("->Filtering url " + articleURL);
        };
        articleCallback();
      });
    }, (err) => {
      resultURLMap[source] = urlList;
      sourceCallback();
    });
    
  }, (err) => {
    console.log('Got all unique urls');
    return callback(resultURLMap);
  });
}

const ArticleScraper = (urlMap) => {
  const sources = Object.keys(urlMap);
  const date_scrapped = Date.now();
  async.each(sources, (source, sourceCallback) => {
    const child = spawn('node', ["ArticleFetcher.js", source, date_scrapped]);
    let callbackSent = false;
    child.on('exit', function (code, signal) {
      console.log(source+' process exited with ' +
                  `code ${code} and signal ${signal}`);
      if (!callbackSent) {
        callbackSent = true;
        sourceCallback();
      }
    });

    child.stdout.on('data', (data) => {
      console.log(`${source} stdout:\n${data}`);
      if (data.indexOf("* Source processed") > -1 && !callbackSent) {
        callbackSent = true;
        sourceCallback();
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`${source} stderr:\n${data}`);
    });
  }, (err) => {
    if (err) console.log(err);
    setTimeout(() => {
      // in case any more mongodb commands are running
      console.log("DONE");
      process.exit(1)
    }, 1000);
  });
}

const FeedScraper = (sources) => {
  const filteredSources = sources.filter((source) => {
    return (source.indexOf('#') !== 0)
  });

  const checkTags = ($, element) => {
    if (!$(element)[0]) return false;
    const tag = $(element)[0].name;
    
    switch (tag) {
      case 'nav':
        return false
    }

    return true;

  };

  const passTags = ($, element) => {
    if (element.closest('article').length > 0) {
      return true
    } else if (element.closest('section').length > 0) {
      return true
    } else if (element.parents('[class*=story]').length > 0) {
      return true
    } else {
      return false;
    };
  }

  const generateURLList = ($, elements, source) => {
    let urls = [];
    for (let i = 0; i < elements.length; i++) {
      const element = $(elements[i]);
      let href = null;
      if (element.is('a')) {
        href = element.attr('href');
      } else {
        href = $(element.find('a')[0]).attr('href');
      }

      if (href != null) {
        if (href.indexOf('//') === 0) {
          urls.push('http:'+href);
        } else if (href.indexOf('/') === 0) {
          let hostname = url.parse(source).hostname;
          if (hostname[hostname.length -1] == '/') {
            hostname = hostname.slice(0, -1);
          }
          const combinedUrl = "http://"+hostname+href;
          urls.push(combinedUrl);
        } else {
          urls.push(href);
        }
      }
    }
    return urls;
  }

  const urlMap = {};
  const failedSources = []
  async.each(filteredSources, (source, callback) => {
    lib.getWebpage(source, (error, body) => {
      if (error) {
        failedSources.push(source);
        console.log("Source Fetching error:", source, error);
        callback();
      } else {
        console.log("Processing", source);
        const $ = cheerio.load(body);

        let newLeaves = [];

        const leaves = $('*:not(:has(*))');
        for (let i = 0; i < leaves.length; i++) {
          const el = $(leaves[i]);
          if (
            !!el.text().trim().length
            && el.text().trim().length > 12
            && el.text().trim().split(' ').length > 3
          ) {
            newLeaves.push(el);
          };
        }

        console.log("Processed:", newLeaves.length);
        newLeaves = newLeaves.map((leaf) => {
          let currentEl = $(leaf);
          let levelsUp = 0;
          while (currentEl.parent() && levelsUp < 10) {
            if (!checkTags($, currentEl)) return null;
            if (currentEl.is(':header')) {
              if (currentEl.closest('article').length > 0) {
                return currentEl.closest('article');
              }

              if (currentEl.has('a')) {
                return currentEl;
              } else if (currentEl.parent().is('a')) {
                return currentEl.parent();
              }
            } else if (currentEl.find('> :header').length > 0) {
              return currentEl;
            } else if (passTags($, currentEl) && currentEl.is('a') && $(currentEl).text().trim().split(' ').length > 4 ) {
              return currentEl;
            } else if (currentEl.is('article')) {
              return currentEl;
            }

            currentEl = currentEl.parent();
            levelsUp++;
          }

          return null;
        }).filter(leaf => !!leaf); // remove null

        // fs.writeFile("./"+source.split('/')[2]+".html", newLeaves, { flag: 'wx' }, function(err) {
        //   if(err) {
        //     return console.log(err);
        //   }
        // });
        console.log("Renderable:", newLeaves.length);
        const urls = generateURLList($, newLeaves, source);

        urlMap[url.parse(source).hostname] = urls;
        callback();
      }
    });
  }, (err) => {
    console.log('All websites scraped');
    if (failedSources.length > 0) {
      console.log('...except '+failedSources.join(', '))
    }
    getUniqueURLs(urlMap, (modifiedUrlMap) => {
      fs.writeFileSync('./urlMap.json', JSON.stringify(modifiedUrlMap));
      ArticleScraper(modifiedUrlMap);
    });
  });
}

process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}\n`);
});

lib.readFileToArray('../config/sources.txt', FeedScraper);