const fs = require('fs');
const mongoose = require('mongoose');
const async = require('async');
const cheerio = require('cheerio');
const phantom = require('phantom');
const lib = require('./lib');
const db = require('../db/schema');
const articleModel = db.model('article');
const trackerInfoModel = db.model('trackerInfo');

function CredScorer(articleMap, trackerList) {
	/*
	Grabs single article from each publication
	articleMap = {
		'publication_domain': 'article_url'
	}
	*/
	// amount of trackers on page
	// - see how Disconnect is doing it?
	// soft_references
	// - read text and get 'important' links within article / quotes
	// bias of publication
	// - scrape media bias websites/apis
	// factual reporting rating
	// - scrape media bias websites/apis

	this.startingScore = 50;
	this.biasRatings = {
		"conspiracy-pseudoscience": 5,
		"extreme": 4,
		"left": 3,
		"right": 3,
		"left-center": 2,
		"right-center": 2,
		"least": 1 
	}
	this.factualReportingRatings = {
		"very high": 1,
		"high": .5,
		"mixed": 0,
		"low": -.5,
		"very low": -1
	};
	this.bias = 1 // add 
	this.factualReporting = "HIGH" // add + 25*factualReporting to score
	this.totalTrackers = 100 // set thresholds
	this.softReferences = 5 // 1 + 10 * log(1 + soft_references / articleWordLength)

	this.updateNormalizedValues = () => {
		const normalizeValues = (articlesWithCred) => {
			const credScores = articlesWithCred.map((article) => {
				if (!article.credibility.score) {
					return null;
				} else {
					return article.credibility.score;
				}
			});
			const min = Math.min.apply(Math, credScores);
			const max = Math.max.apply(Math, credScores);

			for (let i = 0; i < credScores.length; i++) {
				if (!credScores[i]) {
					continue;
				}
				const normalRange = 100;
				let normalizedValue = normalRange*(credScores[i]-min)/(max-min);
				articleModel.update({_id: articlesWithCred[i]['_id']}, {
					'credibility.normalScore': normalizedValue
				}, (err) => {
					if (err) console.log(err);
					if (i == credScores.length-1) {
						console.log("Finished Normalizing Scores");
						process.exit(0);
					}
				})
			}

		}
		const articleCursor = articleModel.find({credibility: {$exists: true}}, { credibility: 1, _id: 1}).cursor();
		let articlesWithCred = [];
		articleCursor.on("data", (article) => {
			articlesWithCred.push(article);
		});

		articleCursor.on('end', () => { 
			normalizeValues(articlesWithCred);
		});
	} 

	this.fetchTrackersForPubs = (forceRun, parentCallback) => {
		const foundTrackerMap = {};
		trackerInfoModel.find({}, (err, trackerLists) => {
			if (!forceRun && trackerLists.length > 0) {
				trackerLists.forEach((trackerInfo) => {
					foundTrackerMap[trackerInfo["publication"]] = trackerInfo["trackerList"];
				});
				parentCallback(foundTrackerMap);
			} else {
				let articleURL;
				const bulk = trackerInfoModel.collection.initializeOrderedBulkOp();
				async.eachSeries(Object.keys(articleMap), (publication, callback)=> {
					articleURL = articleMap[publication];
					(async function() {
					  let foundTrackers = []; 
					  const instance = await phantom.create();
					  const page = await instance.createPage();
					  await page.on('onResourceReceived', function(response) {
					    if (response["url"].indexOf('data:') !== 0 && response["url"].indexOf('http') === 0) {
							if (response["url"].indexOf('optimizely') > -1) {
								console.log(response["url"]);
							}
							for (var i = 0; i < trackerList.length; i++) {
							  	if (response["url"].indexOf(trackerList[i]) > -1) {
							  		console.log("found tracker "+response["url"])
									foundTrackers.push(response["url"]);
							  		break;
							  	}
							}
						} 
					  });
					 
					  const status = await page.open(articleURL);
					  const content = await page.property('content');
					  foundTrackerMap[publication] = foundTrackers;
					  bulk.insert({ publication, trackerList: foundTrackers});
					  await instance.exit();
					  callback();
					})();

				}, () => {
					console.log("Finished", foundTrackerMap);
					if(bulk && bulk.s && bulk.s.currentBatch 
				      && bulk.s.currentBatch.operations 
				      && bulk.s.currentBatch.operations.length > 0){
				      bulk.execute({wtimeout: 5000}, (err, result) => {
				        if (err) console.log(err);
				        if (result) 
				          console.log("INSERTED: "+result.nInserted);
				      	  parentCallback(foundTrackerMap)
				      });
				    } else {
				    	parentCallback(foundTrackerMap)
				    }
					
				});
			}
		})
		
	}

	// returns bias/factual data from MBFC 
	this.fetchMBFCbias = (publication_name, callback) => {
		const urlPubName = publication_name.split(" ").join("+");
		lib.getWebpage(`https://mediabiasfactcheck.com/?s=${urlPubName}`, (err, body) => {
			if (!err) {
				let $ = cheerio.load(body);
				let searchResults = $(".loop-wrap");
				let searchIndex = 0;

				if (publication_name == "New York Magazine"
					|| publication_name.includes("BuzzFeed")
					|| publication_name == "ABC News"
					|| publication_name == "NY Daily News") {
					searchIndex = 1;
				} else if (publication_name == "The Independent"
					|| publication_name == "Daily Star"
					|| publication_name == "The Federalist") {
					searchIndex = 2;
				};

				let pubLink = $(searchResults[searchIndex]).find(".loop-title a").attr("href");
				if (pubLink) {
					lib.getWebpage(pubLink, (err, pubPageBody) => {
						if (!err) {
							const $$ = cheerio.load(pubPageBody);
							const biasText = $$(".content .entry-header h1").children().remove().end().text().trim();

							const factRatingWrapper = $$("p:contains('Factual Reporting:')");
							const factRating = $$(factRatingWrapper.find("span")[0]).text().trim();
							callback({
								bias: this.biasRatings[biasText.split(" ")[0].toLowerCase()],
								factRating: this.factualReportingRatings[factRating.toLowerCase()]
							});	
						}
					})
				}
			} else {
				console.log(`Couldn't fetch MBFCbias for ${publication_name} because of ${err}`);
			}
		})
	}

	this.getReasons = (scoreVector) => {
		const { bias, factRating, trackerCount, softReferences } = scoreVector;
		let reasons = [];
		if (softReferences == 0) {
			reasons.push("Poorly sourced");
		}

		if (bias == 4) {
			reasons.push("Extreme Bias");
		}
		
		if (bias == 5) {
			reasons.push("Provides very little evidence");
		}

		if (factRating < 0) {
			reasons.push("Poor Factual Reporting");
		} else if (factRating == 0) {
			reasons.push("Questionable Factual Reporting");
		}

		if (trackerCount > 100) {
			reasons.push("Aggressive tracking");
		}
		return reasons;
	}

	this.calculateScore = (scoreVector) => {
		const { bias, factRating, trackerCount, softReferences } = scoreVector;
		// returns raw Unnormalized score
		let score = this.startingScore;
		switch (bias) {
			case 1:
				score += 20;
				break;
			case 4:
			case 5:
				score -= 30;
				break;
		}
		score = score + Math.log(score) * (10 * factRating);

		// tracker penalty
		const trackerThreshold = 25;
		const weightMultiplier = 3;
		if (trackerCount > trackerThreshold) {
			const trackerCountOffset = trackerCount - trackerThreshold;
			score = score - (weightMultiplier * Math.log(trackerCountOffset));
		}

	 	if (softReferences > 0) {
	 		score = score + (weightMultiplier * Math.log(softReferences));
	 	}

		return score;
	}

	this.pubScorer = (parentCallback) => {
		self = this;
		const pubBiasFactData = {};
		// Get tracker info first
		this.fetchTrackersForPubs(false, (foundTrackerMap) => {
			async.each(Object.keys(foundTrackerMap), (publicationDomain, callback) => {
				articleModel.findOne({publication: publicationDomain}, {publicationName: 1, publication: 1}, (err, foundArticle) => {
					if (!err && foundArticle && typeof foundArticle["publicationName"] != "undefined") {
						self.fetchMBFCbias(foundArticle["publicationName"], (biasData) => {
							const trackerCount = foundTrackerMap[publicationDomain].length;
							pubBiasFactData[publicationDomain] = Object.assign(biasData, { trackerCount });
							callback();
						});
					} else {
						callback();
					}
				});
				
			}, () => {
				parentCallback(pubBiasFactData)
			});
		});
		// get initial publication score for each article under the publication
		// pub score includes bias/fact details and general tracker information
	}

	this.articleScorer = (pubBiasFactData) => {
		const self = this;
		// get pubBiasFactData and write into db group by publication (bulk execute by publication)
		// alters pub score with soft_reference information about the article
		let scoredArticleCount = 0;
		async.each(Object.keys(pubBiasFactData), (publicationDomain, callback) => {
			articleModel.find({publication: publicationDomain, credibility: { $exists: false }}, {_id: 1, origin: 1, content: 1}, (err, foundArticles) => {
				if (!err) {
					if (!foundArticles) return;
					let pubScoreCount = 0;
					const bulk = articleModel.collection.initializeOrderedBulkOp();
					async.each(foundArticles, (article, childCallback) => {
						let scoreVector = Object.assign(
							pubBiasFactData[publicationDomain],
							{ softReferences: this.countReferences(article.content) }
						)
						
						let calculatedScore = self.calculateScore(scoreVector);
						/*
							Dangerous (too much memory) but I can't use bulk update since mongo
							doesnt support unique subdocument key values in
							bulk update.
						*/ 
			  			articleModel.update({ "_id": mongoose.Types.ObjectId(article._id) }, {
				  			$set: { 
				  				credibility: {
				  					score: calculatedScore,
				  					info: scoreVector,
				  					reasons: self.getReasons(scoreVector)
				  				}
			  				}
			  			}, (err) => {
			  				pubScoreCount++;
							console.log(`${article.origin} score is ${calculatedScore}`);
							childCallback();
			  			});
					}, () => {
						scoredArticleCount += pubScoreCount;
						console.log(`Scored ${pubScoreCount} articles for ${publicationDomain}`);
						callback();
					});

					// if(bulk && bulk.s && bulk.s.currentBatch 
				 //      && bulk.s.currentBatch.operations 
				 //      && bulk.s.currentBatch.operations.length > 0){
				 //      bulk.execute({wtimeout: 5000}, (err, result) => {
				 //        if (err) console.log(err);
				 //        if (result) {
				 //          scoredArticleCount += result.nModified;
				 //          console.log(`Scored ${result.nModified} articles for ${publicationDomain}`);
				 //        }
				 //        callback();
				 //      });
				 //    }

				} else {
					console.log(err);
				}
			})
		}, () => {
			console.log(`Scored a total of ${scoredArticleCount} articles`);
			self.updateNormalizedValues();
		});

	}

	this.countReferences = (articleBody) => {
		if (articleBody.length < 500) return 1; // if article wasnt fetched properly ignore soft references
		const $ = cheerio.load(articleBody);

		let references = $("p a").length // links in paragrahs
		const pTags = $("p");
		let quotesInArticle = [];
		for (let i = 0; i < pTags.length; i++) {
			const pText = $(pTags[i]).text();
			let buildingQuote = false;
			let currentQuote = '';
			for (let x = 0; x < pText.length; x++) {
				if (buildingQuote && pText[x] != "\"") {
					currentQuote += pText[x];
				} else if (buildingQuote && pText[x] == "\"") {
					quotesInArticle.push(currentQuote);
					currentQuote = '';
					buildingQuote = false;									
				} else if (pText[x] == "\"") {
					buildingQuote = true;
				}
			}
		}

		for (let i = 0; i < quotesInArticle.length; i++) {
			const quote = quotesInArticle[i];
			if (quote[quote.length-1] == "."
				|| quote[quote.length-1] == ",") {
				references++;
			}
		}

		return references;
	}

	// One off script
	this.fetchSiteNames = (parentCallback) => {
		console.log("Fetching Site Names");
		articleModel.aggregate(
		   [
		     {
		       $group:
		         {
		           _id: "$publication"
		         }
		     }
		   ],
		   (err, foundPublications) => {
		   	  const siteNames = {};
		   	  const bulk = articleModel.collection.initializeOrderedBulkOp();

		   	  async.each(foundPublications, (foundPub, callback) => {
		   	  	const publicationDomain = foundPub["_id"];
		   	  	lib.getWebpage(`http://${publicationDomain}`, (err, body) => {
		   	  		if (!err) {
		   	  			const $ = cheerio.load(body);
						const fbSiteName = $("meta[property='og:site_name']");
		   	  			let siteName;
		   	  			const parseTitle = (title) => {
		   	  				let result = title;
		   	  				if (title.split('-').length > 1) {
		   	  					result = title.split('-')[0];
		   	  				} else if (title.split(':').length > 1) {
		   	  					result = title.split(':')[0];
		   	  				}
		   	  				return result.trim();
		   	  			}

		   	  			if (fbSiteName.length > 0) {
		   	  				// check if a domain
		   	  				if (fbSiteName.attr('content').split('.').length == 1) {
		   	  					siteName = parseTitle(fbSiteName.attr('content'));
		   	  				}
		   	  			}

		   	  			if (!siteName) {
			   	  			const fbTitle = $("meta[property='og:title']");
		   	  				if (fbTitle.length > 0) {
		   	  					siteName = parseTitle(fbTitle.attr('content'));
		   	  				} else {
		   	  					siteName = parseTitle($("title").text());
		   	  				}	
		   	  			}

		   	  			if (publicationDomain.indexOf("nytimes") > -1) {
		   	  				siteName = $("meta[name='application-name']").attr('content');
		   	  			} else if (publicationDomain.indexOf("reuters") > -1) {
									siteName = $("title").text().split('|')[1].trim();
		   	  			} else if (publicationDomain.indexOf("nydailynews") > -1) {
		   	  				siteName = $("meta[property='og:title']").attr('content').split('-')[1].trim();
		   	  			} else if (publicationDomain.indexOf("npr") > -1) {
		   	  				siteName = parseTitle($("title").text());
		   	  			} else if (publicationDomain.indexOf("nydailynews") > -1) {
		   	  				// Couldnt automate this
		   	  				siteName = "New York Daily News";
		   	  			} else if (publicationDomain.indexOf("dailystar") > -1) {
		   	  				siteName = "Daily Star";
		   	  			} else if (publicationDomain.indexOf("dailymail") > -1) {
		   	  				siteName = "Daily Mail";
		   	  			}
	   	  	
		   	  			if (!siteName) {
		   	  				console.log(`Couldnt fetch ${publicationDomain}`);
		   	  			} else {
		   	  				siteNames[publicationDomain] = siteName;
		   	  				bulk.find( { publication: publicationDomain } ).update( { $set: { publicationName: siteName } } );
		   	  			}

		   	  			callback()
		   	  		} else {
		   	  			console.log(`Couldnt fetch ${publicationDomain} because of ${err}`);
		   	  			callback();
		   	  		}
		   	  	})
		   	  }, () => {
		   	  	console.log("Saving Site Names");
		   	  	
		   	  	if(bulk && bulk.s && bulk.s.currentBatch 
			      && bulk.s.currentBatch.operations 
			      && bulk.s.currentBatch.operations.length > 0){
			      bulk.execute((err, result) => {
			        if (err) console.log(err);
			        if (result) 
			          console.log(result.nModified);
			      	  parentCallback(siteNames);
			      });
			    } else {
			      parentCallback(siteNames);
			    }
		   	  })
		   }
		);
	}
}

articleModel.aggregate(
   [
     {
       $group:
         {
           _id: "$publication",
           origin: { $first: "$origin" }
         }
     }
   ],
   (err, foundArticles) => {
   	 let articleMap = {};
     foundArticles.forEach((article) => {
   		articleMap[article["_id"]] = article["origin"];
   	 });
   	 // articleMap = { "nytimes.com": articleMap["nytimes.com"] };

   	 fs.readFile("trackers.txt",  (err, data) => {
	   if (err) throw err;
	   const trackerList = data.toString('utf-8').split(",");
	   const scorer = new CredScorer(articleMap, trackerList);
	   scorer.fetchSiteNames(() => {
		 scorer.pubScorer((pubBiasFactData) => {
	   	   scorer.articleScorer(pubBiasFactData);
	   	 });	
	   });
   	   
	 });
   }
);
