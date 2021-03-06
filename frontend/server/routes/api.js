const path = require('path');
const fs = require('fs');
const url = require('url');
const express = require('express');
const router = express.Router();
const db = require(path.resolve('./../db/schema'));
const topicModel = db.model('topic');
const reviewModel = db.model('review');
const publicationURLs = fs.readFileSync('./../config/sources.txt').toString().split("\n"); // only runs on server (re)start

const publications = publicationURLs.map((publicationURL) => {
	return url.parse(publicationURL).hostname;
}).filter((publicationDomain) => {
	return (publicationDomain);
});

let topicsPipeline = [
	{ "$project": { 
		"articles": 1,
		"name": 1,
		"summary": 1,
		"headlineImage": 1,
		"coveredBy": 1,
		"date_added": 1,
		"slug": 1
	}},
	// Unwind the source
	{ "$unwind": "$articles" },
	// Do the lookup matching
	{ "$lookup": {
	   "from": "article",
	   "localField": "articles",
	   "foreignField": "_id",
	   "as": "articleObjects"
	}},
	// Unwind the result arrays ( likely one or none )
	{ "$unwind": "$articleObjects" },
	 // Group back to arrays
    { "$group": {
        "_id": {
        	"name": "$name", 
        	"summary": "$summary",
        	"coveredBy": "$coveredBy",
        	"headlineImage": "$headlineImage",
        	"slug": "$slug",
        	"date_added": "$date_added"
        },
        "articles": { "$push": "$articleObjects" }
    }}
]

/* Topic Search */
router.get('/topic', (req, res, next) => {
	const limit = 16;
	const isFetch = req.query.fetch;
	let skip = parseInt(req.query.skip) || 0;
	let filter = req.query.filter || null;
	let publication, searchQuery;
	if (filter) {
	  if (filter.split('pub-').length > 1) {
	  	publication = filter.split('pub-')[1];
	  	filter = 'publication';
	  } else if (filter.split('search-').length > 1) {
	  	searchQuery = filter.split('search-')[1];
	  	filter = 'search';
	  }
	}

	let sort = { date_added: -1 };
	let query = {};

	switch (filter) {
		case "recent":
			// pass
			break;
		case "search":
			query = { "name": { "$regex": searchQuery, "$options": "i" } }
			break;
		case "publication":
			// query = {
			// 	articles: {
			// 		$elemMatch: {
			// 			publication
			// 		}
			// 	}
			// };
			break;
	}

  	topicModel.find(query)
	  		  .sort(sort)
	  		  .skip(skip)
	  		  .limit(limit)
	  		  .exec((err, topics) => {
		if (err) console.log(err);
		if (isFetch) {
			res.send({ topics });
		} else {
			const query = [ 
				{
					$project: {
						name: 1,
						slug: 1,
			        	length: { $size: "$articles" }
			    	}
			    },
			    { 
			    	$sort: { 
			    		length: -1
			    	}
			    },
		        {
		        	$limit: 4
		        },
		        {
					$sort: {
						date_added: -1
					}
		        }
		    ];
		    topicModel.aggregate(query, (err, topTopicsData) => {
		    	if (err) console.log(err);

				res.render('index', {
					page: 'main',
			  		title: 'StoryBreak',
			  		currentPublication: publication,
			  		topics,
			  		publicationList: publications,
			  		topTopics: topTopicsData
			  	});	
		    });
		}
  	});
});


router.get('/topic/:slug', (req, res, next) => {
	const topicPipeline = [{
		"$match": {
			"slug": req.params.slug
		}
	}, ...topicsPipeline];

	topicModel.aggregate(topicPipeline).exec((err, topicFetched) => {
		if (err) console.log(err);
		const topicToRender = (topicFetched) ? topicFetched[0] : null; 
		if (topicToRender) {
			res.send(topicToRender);
		} else {
			res.send({error: true})
		}
	})
});

/* Save Review */
router.post('/save-review', (req, res, next) => {
	const { rating, topicSlug, articleSlug, reviewContent, publication, reviewer } = req.body;

	const newReview = new reviewModel({
		rating,
		topicSlug,
		articleSlug,
		reviewContent,
		publication,
		reviewer
	});

	newReview.save();
});

/* Get Reviews */
router.get('/reviews', (req, res, next) => {
	const articleSlug = req.query.articleSlug;
	reviewModel.find({ articleSlug }, (err, foundReviews) => {
    	if (err) console.log(err);
		res.send(foundReviews);
    });
});

module.exports = router;
