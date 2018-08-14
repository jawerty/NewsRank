const fs = require('fs');
const db = require('../db/schema');
const articleModel = db.model('article');

const redGreenScale = (percentage, alpha) => {
	const A = (alpha) ? alpha : 1;
	const low = 100;
	const high = 225;
	const B = low;
	if (percentage == 100) {
	  return `rgba(${low},${high},${low},${A})`;
	}  else if (percentage == 0) {
	  return `rgba(${high},${low},${low},${A})`;
	};

	const denomination = (high-low)/100;
	const value = percentage*denomination;
	const offset = (100-percentage)*denomination;

	const R = low + offset
	const G = low + value;
	const rgbValue = `rgba(${parseInt(R)}, ${parseInt(G)}, ${parseInt(B)}, ${A})`;
	return rgbValue;
}

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
    		'date_scrapped': -1,
    	}
    },
	{
		'$group': {
			'_id': '$publicationName',
			'overallRating': { '$avg': '$credibility.score' },
			'lastArticleLink': { $first: "$origin" },
			'lastArticleTitle': { $first: "$title" }
		}
	},
    {
    	'$sort': {
    		'overallRating': -1,
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
		if (pub.overallRating < 0) {
			pub.overallRating = 0;
		}
		pub.color = redGreenScale(pub.overallRating);
		return pub;
	});

	fs.writeFile('../config/rankings.json', JSON.stringify(foundPublications), (err) => {
		if (err) throw err;
		console.log('Rankings have been generated');
		process.exit(0);
	});

});