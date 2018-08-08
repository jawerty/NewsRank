// process more than about 1000 articles it breaks!
// run with --max-old-space-size=4096 if processing  more than ~1000 articles
const natural = require('natural');
const async = require('async');
const slug = require('slug');
const cheerio = require('cheerio');
const SummaryTool = require('./node-summary'); // had to transpile summary tool with webpack
const db = require('../db/schema');
const articleModel = db.model('article');
const topicModel = db.model('topic');
const scrape_time = Date.now();
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
					callback(summary, foundArticles)
				}
			)
		}
	)
}

const generateTopics = (articleGroupings, date_grouping, parentCallback) => {
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
		const dedupedArticleGroupings = {}
		// WARNING: Very SUBOPTIMAL FUNCTION 
		// dedup articleGroupingMap (combine topics including separate articles)
		primaryArticles.forEach((primaryArticle) => {
			articleGroupingMap[primaryArticle] = articleGroupingMap[primaryArticle].reduce((a, c) => {
				return (c.length > a.length) ? c : a 
			});
		});

		Object.entries(articleGroupingMap).forEach((grouping) => {
			let primaryArticle = grouping[0];
			let groupingArticles = grouping[1];
			for (let i = 0; i < groupingArticles.length; i++) {
				let currentArticle = JSON.parse(groupingArticles[i].label).pubSlug;
				let tempArticleGroupingsMap = JSON.parse(JSON.stringify(articleGroupingMap));
				delete tempArticleGroupingsMap[primaryArticle];
				Object.entries(tempArticleGroupingsMap).forEach((groupingToCheck) => {
					for (let x = 0; x < groupingToCheck[1].length; x++) {
						let articleToCheck = groupingToCheck[1][x];
						if (currentArticle == JSON.parse(articleToCheck.label).pubSlug) {
							groupingToCheck[1].splice(x, 1);
							dedupedArticleGroupings[primaryArticle] = groupingToCheck[1].concat(groupingArticles);
							delete articleGroupingMap[groupingToCheck[0]];
						}
					}
				});

			};
		})


		const finalArticleGroupingMap = Object.assign(articleGroupingMap, dedupedArticleGroupings);
		const finalPrimaryArticles = Object.keys(finalArticleGroupingMap);

		async.each(finalPrimaryArticles, (primaryArticle, articleCallback) => {
			const group = finalArticleGroupingMap[primaryArticle];
			const allTitles = [];
			const articles = group.map((article) => {
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
						strippedName = JSON.parse(group[0].label).title
					}

					summarizeArticles(articles, (summary, foundArticles) => {
						const coveredBy = [];
			    		const articleImages = foundArticles.filter((article) => {
			    			if (coveredBy.indexOf(article.publication) == -1)
			    				coveredBy.push(article.publication);
			    			return ('headlineImage' in article);
			    		}).map((filteredArticle) => {
			    			return filteredArticle.headlineImage;
			    		});
			    		const topicHeadlineImage = (articleImages.length > 0) ?
			    			 	articleImages[0] : null;
			    	    console.log("Inserting", strippedName);
						bulk.insert({
							coveredBy,
							date_added: scrape_time,
							articles,
							name: strippedName,
							summary,
							headlineImage: topicHeadlineImage,
							slug: slug(strippedName).toLowerCase()
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
		if(bulk && bulk.s && bulk.s.currentBatch 
	      && bulk.s.currentBatch.operations 
	      && bulk.s.currentBatch.operations.length > 0){
			bulk.execute((err, result) => {
				if (err) console.log(err);
				if (result) {
					setTimeout(() => {
				      // in case any more mongodb commands are running
				     articleModel.updateMany(
				      	{
				      		trained: false,
				      		date_scrapped: { $in: date_grouping }
				      	}, 
				      	{ 
				      		$set: { 
				      			trained: true 
				      		}
				      	},
				      	(err) => {
					      console.log("TOPICS INSERTED:", result.nInserted);
						  console.log("DONE");

					      parentCallback();
				      	});
				    }, 1000);
				} else {
					console.log("Write failed");
					parentCallback();
				}
				
			});	
		} else {
			console.log("No operations in batch");
			parentCallback();
		}
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
	
	articleModel.distinct("date_scrapped", (err, dates) => {
		// group dates by day [[timestamp, timestamp], [timestamp, timestamp]];
		const date_groupings = [];
		let date_range = 0;
		for (let i = 0; i < dates.length; i++) {
			if (dates[i] > date_range) {
				date_range = dates[i] + (6*60*60*1000);
				date_groupings.push([dates[i]]);
			} else if (dates[i] < date_range) {
				date_groupings[date_groupings.length-1].push(dates[i]);
			}
		}

		const d = new Date();
		d.setDate(d.getDate()-2); // two days ago
		const yesterday = d.getTime();
		// articleModel.remove({date_scrapped: { $lte: yesterday }}, (err, ) => {
			// // run this to remove articles
		// })
		async.each(date_groupings, (date_grouping, callback) => {
			const classifier = new natural.BayesClassifier();
			classifier.events.on('trainedWithDocument', function (obj) {
				console.log(`trained object #${obj.index+1} out of ${obj.total}`)
		    });
			let articleCursor = articleModel.find({date_scrapped: { $in: date_grouping, $gte: yesterday } }, { _id: 1, title: 1, tokens: 1, publicationSlug: 1 }).cursor();

			let allArticles = [];
			articleCursor.on('data', (article) => {
				// console.log("Adding document for "+article.title);
				classifier.addDocument(article.tokens.concat(article.title.split(" ")).join(' '), JSON.stringify({
					id: article._id,
					pubSlug: article.publicationSlug,
					title: article.title
				}));
				allArticles.push(article);
			});

			articleCursor.on('end', () => {
				console.log("Training Date Group: "+date_grouping);
				classifier.train();

				let articleGroupings = allArticles.map((article) => {
					let classifications = classifier.getClassifications(article.title);
					// console.log(classifications.slice(0,10));
					if (classifications[1].value < 0.001) {
						return [];
					}
					let uniqueValues = classifications.map((classification) => {
						return classification.value;
					}).filter(function(item, pos, self) {
					    return self.indexOf(item) == pos;
					});
					if (uniqueValues.length < 5) return []; // sauce
					classifications = normalizeValues(classifications);

					if (classifications[1].normalValue < 3) return []; // sauce
					let filtered = classifications.filter((classification) => {
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
				generateTopics(articleGroupings, date_grouping, callback);
			});

		}, () => {
			console.log("DONE ALL");
			process.exit(0);
		}); 
	})
		

}

classifyAritcles();