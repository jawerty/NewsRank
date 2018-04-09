// run with --max-old-space-size=4096
const natural = require('natural');
const async = require('async');
const slug = require('slug');
const cheerio = require('cheerio');
const SummaryTool = require('node-summary');

const db = require('./schema');
const articleModel = db.model('article');
const topicModel = db.model('topic');

// Returns a list of topics corresponding to each article grouping and saves to database
const summarizeArticles = (articleIds, callback) => {
	articleModel.find( 
		{ 
			_id: { 
				$in: articleIds  
			} 
		},
		(err, foundArticles) => {
			const allArticlesText = foundArticles.reduce((a, c) => {
				return a.content + c.content;
			});
			const $ = cheerio.load(allArticlesText);
			const allText = $("*").text();
			SummaryTool.getSortedSentences(
				allText,
				4,
				(err, sorted_sentences) => {
					let summary = null;
					if (sorted_sentences) {
						summary = sorted_sentences.filter((item, pos, self) => {
						    return self.indexOf(item) == pos;
						}).join(' ');	
					}
					callback(summary)
				}
			)
		}
	)
}

const generateTopics = (articleGroupings) => {
	const bulk = topicModel.collection.initializeOrderedBulkOp();
	
	const generation = (callback) => {
		const articleGroupingMap = {}; 
		for (let i = 0; i < articleGroupings.length; i++) {
			const articleGroup = articleGroupings[i];
			if (articleGroup.length == 0) continue;
			const primaryArticle = JSON.parse(articleGroup[0].label).pubSlug;
			if (primaryArticle in articleGroupingMap) {
				articleGroupingMap[primaryArticle].push(articleGroup);
			} else {
				articleGroupingMap[primaryArticle] = [articleGroup];
			}
		}

		const primaryArticles = Object.keys(articleGroupingMap);
		async.each(primaryArticles, (primaryArticle, articleCallback) => {
			// get grouping with greatest length
			const largestGroup = articleGroupingMap[primaryArticle].reduce((a, c) => {
				return (c.length > a.length) ? c : a 
			});
			const allTitles = [];
			const articles = largestGroup.map((article) => {
				const articleLabel = JSON.parse(article.label);
				allTitles.push(articleLabel.title);
				return db.Types.ObjectId(articleLabel.id);
			});

			SummaryTool.summarize(
				"",
				allTitles.join(". "),
				(err, summary) => {
					if (err) console.log(err);
					let strippedName = summary.trim();

					if (!strippedName 
						|| (strippedName && strippedName.length == 0)) {
						strippedName = JSON.parse(largestGroup[0].label).title
					}

					summarizeArticles(articles, (summary) => {
						bulk.insert({
							articles,
							name: strippedName,
							summary,
							slug: slug(JSON.parse(largestGroup[0].label).pubSlug).toLowerCase()
						});
						articleCallback();
					});
					
				}
			);
			
		}, (err) => {
			callback();
		});
		

	}

	generation(() => {
		bulk.execute((err, result) => {
			if (err) console.log(err);
			console.log("TOPICS INSERTED:", result.nInserted);
			setTimeout(() => {
		      // in case any more mongodb commands are running
		     articleModel.updateMany(
		      	{trained: false}, 
		      	{ 
		      		$set: { 
		      			trained: true 
		      		}
		      	},
		      	(err) => {
			      console.log("DONE");
			      process.exit(1)
		      	});
		    }, 1000);
		});	
	})
	
}

// Returns multidimensional arrays of article titles (slugs?) grouped together by similarity
const classifyAritcles = () => {
	const normalizeValues = (classifications) => {
		const classValues = classifications.map((classification) => {
			return classification.value;
		});
		const min = Math.min.apply(Math, classValues);
		const max = Math.max.apply(Math, classValues);

		for (let i = 0; i < classifications.length; i++) {
			const normalRange = 10;
			let normalizedValue = normalRange*(classifications[i].value-min)/(max-min);
			classifications[i].normalValue = normalizedValue;
		}

		return classifications;
	}
	// get current classification?
	const classifier = new natural.BayesClassifier();

	const articleCursor = articleModel.find({ trained: false }, { _id: 1, title: 1, tokens: 1, publicationSlug: 1 }).cursor();

	const allArticles = []
	articleCursor.on('data', (article) => {
		console.log("Adding document for "+article.title);
		classifier.addDocument(article.tokens.concat(article.title.split(" ")).join(' '), JSON.stringify({
			id: article._id,
			pubSlug: article.publicationSlug,
			title: article.title
		}));
		allArticles.push(article);
	});

	articleCursor.on('end', () => {
		console.log("Training...");
		classifier.train();

		const articleGroupings = allArticles.map((article) => {
			let classifications = classifier.getClassifications(article.title);
			// console.log(classifications.slice(0,10));
			if (classifications[1].value < 0.001) {
				return [];
			}
			const uniqueValues = classifications.map((classification) => {
				return classification.value;
			}).filter(function(item, pos, self) {
			    return self.indexOf(item) == pos;
			});
			if (uniqueValues.length < 5) return []; // sauce
			classifications = normalizeValues(classifications);

			if (classifications[1].normalValue < 3) return []; // sauce
			const filtered = classifications.filter((classification) => {
				if (classification.normalValue > 1) {
					return true;
				}
				return false;
			}).filter(function(item, pos, self) {
				let foundItems = 0;
			    for (let i = 0; i < self.length; i++) {
			    	if (JSON.parse(self[i].label).pubSlug == JSON.parse(item.label).pubSlug) {
			    		if (foundItems == 1) {
			    			return false;
			    		}
			    		foundItems++;
			    	}
			    };
			    return true;
			});

			if (filtered.length > 1) {
				return filtered;
			} else {
				return [];
			}
		});

		topicModel.remove({}, (err) => {
			generateTopics(articleGroupings);
		});
	});
		

}

classifyAritcles();