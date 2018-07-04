node --max-old-space-size=4096 --stack-size=1000000 StoryScraper.js;
node Tokenizer.js;
node TopicGenerator.js;
node CredScorer.js;