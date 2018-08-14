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
		'$group': {
			'_id': '$publicationName',
			'overallRating': { '$avg': '$credibility.score' }
		}
	}
];
articleModel.aggregate(pipeline, function(err, foundPublications) {
	foundPublications = foundPublications.filter(function(pub) {
		if (!pub['overallRating']) {
			return false;
		}
		return true;
	});

	fs.writeFile('../config/rankings.json', JSON.stringify(foundPublications), (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
	});

});