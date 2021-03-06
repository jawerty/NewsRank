const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const db = require(path.resolve('./../db/schema'));
const articleModel = db.model('article');
const topicModel = db.model('topic');

/* GET home page. */
router.get('/suggestArticle', function(req, res, next) {
	const articleURL = req.query.url;
	const lowMode = req.query.lowMode;
	console.log(articleURL);
	articleModel.findOne({origin: {$regex : articleURL}}, {_id: 1, origin: 1, publicationName: 1, title: 1, credibility: 1, publication: 1}, (err, foundArticle) => {
		if (err) {
			console.log(err);
			res.send({suggestions: null, error: "db error: " + err});
		} else {
			if (foundArticle) {
				if (articleURL.length/foundArticle.origin.length < .50) {
					console.log("Article is in origin BUT is not similar enough")
					return res.send({suggestions: null, error: "Article url is in found link BUT is not similar enough"});
				} else if (foundArticle.credibility && foundArticle.credibility.score >= 80) {
					return res.send({suggestions: null, error: "Article's credibility score is good: "+foundArticle.credibility.score})
				} else if (lowMode && foundArticle.credibility && foundArticle.credibility.score >= 60) {
					return res.send({suggestions: null, error: "Score is "+foundArticle.credibility.score+" blocked by Low Mode"})
				} else if (!foundArticle.credibility) {
					return res.send({suggestions: null, error: "This article does not have a credibility score"})
				}
				console.log("Found Article");
				topicModel.aggregate([
					{ 
						$project: {
							hasArticle: {
								$in: [ foundArticle["_id"], "$articles" ]
							},
							articles: 1,
							name: 1,
							summary: 1,
							headlineImage: 1,
							coveredBy: 1,
							date_added: 1,
							slug: 1
					    }
					},
					{
						$match: {
							"hasArticle": true
						}
					},
					// Unwind the source
					{ $unwind: "$articles" },
					// Do the lookup matching
					{ 
						$lookup: {
							from: "article",
							localField: "articles",
							foreignField: "_id",
							as: "articleObjects"
						}
					},
					// Unwind the result arrays ( likely one or none )
					{ $unwind: "$articleObjects" },
					 // Group back to arrays
				    { 
				    	$group: {
					        _id: {
					        	name: "$name", 
					        	coveredBy: "$coveredBy",
					        	headlineImage: "$headlineImage"
					        },
					        articles: { $push: "$articleObjects" }
				    	}
					}
				], (err, foundTopics) => {
					if (err) console.log(err);
					if (foundTopics.length > 0) { // should only be one
						let isBest = false;
						let suggestions = [];
						foundTopics.forEach((topic) => {
							let articles = topic.articles;
							let highestScore = 0
							let highestScoreIndex = 0;
							for (let i = 0; i < articles.length; i++) {
								if ("credibility" in articles[i]
									&& articles[i].credibility.score > highestScore) {
									highestScore = articles[i].credibility.score;
									highestScoreIndex = i;
								}
							}
							if (articles[highestScoreIndex]._id.equals(foundArticle._id)) {
								isBest = true;
							} else {
								suggestions.push(articles[highestScoreIndex]);
							}
						});

						if (suggestions.length > 0) {
							console.log("Sending down article");
							res.send({suggestions, received: foundArticle});
						} else if (isBest) {		
							console.log("Article is already the best");
							res.send({suggestions: null, error: "Article is already the best"});
						} else {
							console.log("Found topics, had an issue");
							res.send({suggestions: null, error: "Found topics, had an issue"});						
						}
					} else {
						console.log("Couldn't get topic");
						res.send({suggestions: null, error: "Couldnt get topic"});						
					}

				})

			} else {
				console.log("Article not found");
				res.send({suggestions: null, error: "Article not found"});
			}	
		}
	})
});

router.get('/', function (req, res, next) {
	fs.readFile(path.resolve('./../config/rankings.json'), (err, data) => {
		if (err) console.log(err);
		let rankings = [];
		if (data) {
			rankings = JSON.parse(data);
		}
		console.log(rankings);
		res.render('home', {title: "Newsblock", rankings});
	});
});
module.exports = router;
