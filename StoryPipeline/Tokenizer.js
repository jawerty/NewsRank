// run with --max-old-space-size=4096
const fs = require("fs");
const natural = require('natural');
const cheerio = require('cheerio');
const async = require('async');
const WordPOS = require('wordpos')
const db = require('../db/schema');

const Tokenizer = () => {
	const genWeightedTokens = (tokenWeights) => {
		let weightedTokens = [];
		const tokenNames = Object.keys(tokenWeights);
		const tokenValues = Object.values(tokenWeights);
		const min = Math.min.apply(Math, tokenValues);
		const max = Math.max.apply(Math, tokenValues);

		for (let i = 0; i < tokenValues.length; i++) {
			const normalRange = 10;
			let normalizedWeight = parseInt(
				normalRange*(tokenValues[i]-min)/(max-min)
			);
			if (normalizedWeight == 0) normalizedWeight++;
			tokenWeights[tokenNames[i]] = normalizedWeight;
		}

		for (let i = 0; i < tokenNames.length; i++) {
			for (let x = 0; x < tokenWeights[tokenNames[i]]; x++) {
				weightedTokens.push(tokenNames[i]);
			}
		}
		return weightedTokens
	}

	let articleModel = db.model('article');
	// group dates by day [[timestamp, timestamp], [timestamp, timestamp]];
	const articleCursor = articleModel.countDocuments({tokens: {$exists: false}}, (err, count) => {
		if (count == 0) {
			return;
		}
		console.log("Count", count);
		const iterations = Math.ceil(count / 500);
		let iterationArray = [];
		for (let i = 0; i < iterations; i++) {
			iterationArray.push(i);
		}
		console.log("Iterations", iterations);
		let amount = 0;
		let x = 0;
		async.eachSeries(iterationArray, (iteration, callback) => {
			let articleTokens = {};
			let iterator = 0;
			let wordpos = new WordPOS({});
			let TfIdf = natural.TfIdf;
			let tfidf = new TfIdf();
			
			let articleCursor = articleModel.find({ 
				$or: [
					{ tokens: {$size: 0} },
					{ tokens: {$exists: false} }
				]
			}, {}, {skip: amount, limit:500}).cursor();
			articleCursor.on("data", (article) => {
				x++;
				// console.log(x);
				articleCursor.pause() // run events as they are added to call stack
				let $ = cheerio.load(article.content);
				let allText = $("*").text();

				wordpos.getPOS(allText, (pos) => {
					let tokens = [];
					let nouns = pos.nouns;
					let rest = pos.rest; // all non POS (usually real world indentifiers)
					nouns.forEach((word) => {
						tokens.push([word, "noun"]);
					});
					rest.forEach((word) => {
						tokens.push([word, "rest"]);
					});
					tfidf.addDocument(allText.toLowerCase());
					console.log("Adding document "+article.title);
					articleTokens[iterator] = {
						article,
						tokens
					};
					iterator++;
					articleCursor.resume(); // get new data as their callbacks are added to call stack
				});
			});

			articleCursor.on('end', () => { 
				console.log("All documents have been added for tokenizing");

				// meh
				let articlesCount = Object.keys(articleTokens).length;
				async.each(Object.keys(articleTokens), (index, topCallback) => {
					let tokenWeights = {};
					async.each(articleTokens[index].tokens, (token, bottomCallback) => {
						let weight = tfidf.tfidf(token[0], index);
						// if (articleTokens[index].article.title.includes("Israel"))
						// 	console.log(
						// 		articleTokens[index].article.title,
						// 		token,
						// 		weight
						// 	);

						if (weight > 70 && token[1] == "noun") tokenWeights[token[0]] = weight
						else if (weight > 30 && token[1] == "rest") tokenWeights[token[0]] = weight
						bottomCallback();
					}, (err) => {
						let weightedTokens = genWeightedTokens(tokenWeights);
						weightedTokens = weightedTokens.map((token) => token.toLowerCase());
						articleTokens[index].article.tokens = weightedTokens;
						articleTokens[index].article.markModified("tokens");
						articleTokens[index].article.save();

						topCallback();
					})
					
				}, (err) => {
					amount += 500;
					if (amount > count) {
						amount = count;
					}
				    conso le.log("Processed "+amount+" out of "+count);
				    callback();
				});
			});
		}, (err) => {
			setTimeout(() => {
				console.log("DONE");
				process.exit(0);
			}, 1000)
		});
	});
	

}

process.on('uncaughtException', (err) => {
	console.log(`Caught exception: ${err}\n`);
});

Tokenizer();