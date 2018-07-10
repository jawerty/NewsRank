const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const db = require(path.resolve('./../db/schema'));
const articleModel = db.model('article');
const topicModel = db.model('topic');

/* GET home page. */
router.get('/suggestArticle', function(req, res, next) {
	const articleURL = req.query.url;
	console.log(articleURL);
	articleModel.findOne({origin: {$regex : articleURL}}, {_id: 1, origin: 1, publicationName: 1, title: 1, credibility: 1}, (err, foundArticle) => {

		if (err) {
			console.log(err);
			res.send({suggestions: null});
		} else {
			if (foundArticle) {
				if (articleURL.length/foundArticle.origin.length < .50) {
					console.log("Article is in origin BUT is not similar enough")
					return res.send({suggestions: null});
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
						const topic = foundTopics[0]; 
						const articles = topic.articles;

						let highestScore = 0
						let highestScoreIndex = 0;
						articles.forEach((article, index) => {
							if ("credibility" in article
								&& article.credibility.score > highestScore) {

								highestScore = article.credibility.score;
								highestScoreIndex = index;
							}
						});
						if (articles[highestScoreIndex]._id.equals(foundArticle._id)) {
							console.log("Article is already the best");
							res.send({suggestions: null});
						} else {
							console.log("Sending down article");
							const suggestions = [articles[highestScoreIndex]];
							res.send({suggestions, received: foundArticle});
						}
					} else {
						console.log("Couldn't get topic");
						res.send({suggestions: null});						
					}

				})

			} else {
				console.log("Article not found");
				res.send({suggestions: null});
			}	
		}
	})
});

module.exports = router;
