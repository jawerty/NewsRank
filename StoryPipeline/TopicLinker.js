const async = require('async');
const hclust = require("ml-hclust");

const db = require("../db/schema");
const topicModel = db.model('topic');
const articleModel = db.model('article');
const topicStackModel = db.model('topicStack');

const topicCursor = topicModel.find({}).cursor();

const allTopics = [];

topicCursor.on('data', (topic) => {
	allTopics.push(topic);	
});

topicCursor.on('end', () => {
	const tokenOccurrencesMap = {};
	let condensedTokenVector = [];
	async.each(allTopics, (topic, callback) => {
		const articleCursor = articleModel.find({
			_id: { 
				$in: topic.articles  
			}
		}).cursor();

		const foundArticles = []
		articleCursor.on('data', (article) => {
			foundArticles.push(article);
		});

		articleCursor.on('end', () => {
			let allTokens = foundArticles.map((article) => {
				return article.tokens;
			});
			allTokens = [].concat.apply([], allTokens);
			let tokenOccurrences = {}
			allTokens.forEach((token) => {
				if (token in tokenOccurrences) {
					tokenOccurrences[token]++;
				} else {
					tokenOccurrences[token] = 1;
				};
			});
			Object.keys(tokenOccurrences).forEach((tokenName) => {
				if (tokenOccurrences[tokenName] == 1) {
					delete tokenOccurrences[tokenName];
				}
			});
			tokenOccurrencesMap[topic._id] = tokenOccurrences;
			condensedTokenVector.push(Object.keys(tokenOccurrences));
			callback();
		});
	}, (err) => {
		condensedTokenVector = [].concat.apply([], condensedTokenVector);
		condensedTokenVector = condensedTokenVector.filter((item, pos, self) => {
		    return self.indexOf(item) == pos;
		});
		// vectors will be the same order as Object.keys(tokenOccurrencesMap);
		const vectors = Object.keys(tokenOccurrencesMap).map((topicTitle) => {
			let vector = (new Array(condensedTokenVector.length)).fill(undefined)
			return vector.map((space, index) => {
				const tokenOccurrences = tokenOccurrencesMap[topicTitle];
				const token = condensedTokenVector[index];
				if (Object.keys(tokenOccurrences).indexOf(token) > -1) {
					return tokenOccurrences[token];
				} else {
					return 0;
				}
			});
		})
		// console.log(vectors)

		const agnes = hclust.agnes(vectors);
		const clusters = agnes.cut(50).filter((cluster) => {
			return cluster.children.length > 0;
		});

		const groupClusters = (clusters, callback) => {
			const clusterGroup = clusters.map((cluster) => {
				let clusterIndexes = []
				for (let i = 0; i < cluster.index.length; i++) {
					clusterIndexes.push(cluster.index[i].index);
				}
				return clusterIndexes;
			});
			callback(
				clusterGroup.map((groupling) => {
					return groupling.filter((item, pos, self) => {
					    return self.indexOf(item) == pos;
					}).map((groupIndex) => {
						return Object.keys(tokenOccurrencesMap)[groupIndex];
					});
				})
			)
		} 

		groupClusters(clusters, (clusterGroup) => {
			console.log(clusterGroup);
			topicStackModel.remove({}, () => {
				clusterGroup.forEach((cluster) => {
					topicStackModel({
						topics: cluster
					}).save();
				});	
			})
			
		})
	   	// console.log("VECTORS", vectors.length);
	});
	
});

topicCursor.on('error', (err) => {
	console.log(err);
});

