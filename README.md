# NewsRank MVP
In Development, check google doc for feature list

# Setup
## Mongodb
Run Mongodb in the background

## StoryPipeline
Install and run the pipeline
```
$ cd StoryPipeline
$ npm install
$ node StoryScraperjs; node Tokenizer.js; node TopicGenerator
```

## Frontend
Install, build and run the server
```
$ cd frontend
$ npm install
$ npm run webpack // run on it's own session
$ npm start // run on it's own session
```


# NewsGate
-> Hit page
--> Check if page's url is in source list
----> If it is then 
------> Check if the article is in the database
------> If it's in the database, check it's credibility score (already saved)
--------> if it's low then return the best article from the topic's list
----------> Use returned article to suggest it in the view
--------> if it's high then do nothing but show that it's a quality article in the popup
------> If not in the database do nothing (say this article has not been scraped -> button to scrape article and add to database?)
--==> If not do nothing
