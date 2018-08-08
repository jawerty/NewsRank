const db = require('../db/schema');
const articleModel = db.model('article');

const ArchiveArticles = () => {
	let d = new Date();
	const lastWeekTs = d.setDate(d.getDate() - 7);
	d = new Date();
	const twoDaysAgoTs = d.setDate(d.getDate() - 1);
	console.log("Removing articles before "+lastWeekTs);
	articleModel.remove({date_scrapped: { $lt: lastWeekTs} }, () => {
		console.log("Archiving articles before "+twoDaysAgoTs);
		const articleCursor = articleModel.find({
			date_scrapped: { $lt: twoDaysAgoTs },
			trained: true
		}).cursor();

		let i = 0;
		articleCursor.on('data', (article) => {
			articleCursor.pause();
			i++;
			article.content = 'archived';
			article.markModified('content');
			article.save();
			articleCursor.resume();
		});

		articleCursor.on('end', () => {
			console.log("Archived "+i+" articles");
			setTimeout(() => {
				process.exit(0);
			}, 1000);
		});
	});
}

ArchiveArticles();	