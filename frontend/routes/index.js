const express = require('express');
const router = express.Router();
const db = require('../../schema');
const topicModel = db.model('topic');

/* GET home page. */
router.get('/', (req, res, next) => {
  topicModel.find({}, (err, topics) => {
	if (err) console.log(err);
  	res.render('index', {
  		title: 'StoryBreak',
  		topics
  	});
  })
  
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
		if (topicToRender["_id"])
			topicToRender._id.headlineImage = topicToRender.articles[0].headlineImage;
	  	res.render('topic', {
	  		title: 'StoryBreak', 
	  		topic: topicToRender
	  	});
		
  })
  
});
module.exports = router;
