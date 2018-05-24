const fs = require('fs');
const url = require('url');
const express = require('express');
const router = express.Router();
const db = require('../../schema');
const topicModel = db.model('topic');

const publicationURLs = fs.readFileSync('../sources.txt').toString().split("\n"); // only runs on server (re)start

const publications = publicationURLs.map((publicationURL) => {
	return url.parse(publicationURL).hostname;
}).filter((publicationDomain) => {
	return (publicationDomain)
});
/* GET home page. */
router.get('/', (req, res, next) => {
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
			console.log(topics);
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
  topicModel.aggregate([
  	{ "$match": { 
    	"slug": req.params.slug
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
        	name: "$name", 
        	summary: "$summary"
        },
        "articles": { "$push": "$articleObjects" }
    }}
	], (err, topic) => {
		if (err) console.log(err);
		const topicToRender = (topic) ? topic[0] : {}; 
		if (topicToRender && topicToRender["_id"])
			topicToRender._id.headlineImage = topicToRender.articles[0].headlineImage;
	  	res.render('topic', {
	  		page: 'topic',
	  		title: 'StoryBreak', 
	  		topic: topicToRender
	  	});
		
  })
  
});
module.exports = router;
