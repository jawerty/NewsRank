const fs = require('fs');
const db = require('../db/schema');
const articleModel = db.model('article');
const pipeline = [
	{
		'$match': {
			'publicationName': {
				'$exists': true
			}
		}
	},
    {
    	'$sort': {
    		'date_scrapped' : -1
    	}
    },
	{
		'$group': {
			'_id': '$publicationName',
			'overallRating': { '$avg': '$credibility.score' },
			'lastArticleLink': { $first: "$origin" },
			'lastArticleTitle': { $first: "$title" }
		}
	}
];
articleModel.aggregate(pipeline, function(err, foundPublications) {
	foundPublications = foundPublications.filter(function(pub) {
		if (!pub['overallRating']) {
			return false;
		}
		return true;
	}).map(function(pub){
		pub.overallRating = Math.ceil(pub.overallRating);
		return pub;
	});

	fs.writeFile('../config/rankings.json', JSON.stringify(foundPublications), (err) => {
		if (err) throw err;
		console.log('Rankings have been generated');
		process.exit(0);
	});

});