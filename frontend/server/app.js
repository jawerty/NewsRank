const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require(path.resolve('./../db/schema'));
const topicModel = db.model('topic');

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve('build')));
app.use(express.static(path.resolve('server/public')));

const topicsPipeline = [
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

app.get('/', (req, res, next) => {
	const fetch = req.query.fetch;
	topicModel.aggregate(topicsPipeline).sort({date_added: -1})
		.skip(0)
		.limit(16)
		.exec((err, topicsFetched) => {
		if (err) console.log(err);
		topicsFetched = topicsFetched.map((topic) => {
			return {
				name: topic["_id"].name,
				summary: topic["_id"].summary,
				coveredBy: topic["_id"].coveredBy,
				headlineImage: topic["_id"].headlineImage,
				slug: topic["_id"].slug,
				date_added: topic["_id"].date_added,
				articles: topic.articles
			}
		})
		if (fetch) {
			res.send(topicsFetched);
		} else {	
			res.locals.topicsData = topicsFetched
			next(); 
		}
	});
});

app.get('/topic/:slug', (req, res, next) => {
	topicModel.aggregate(topicsPipeline).exec((err, topicFetched) => {
		if (err) console.log(err);
		const topicToRender = (topicFetched) ? topicFetched[0] : null; 
		if (topicToRender) {
			res.locals.topicData = {
				name: topicToRender["_id"].name,
				summary: topicToRender["_id"].summary,
				headlineImage: topicToRender["_id"].headlineImage,
				date_added: topicToRender["_id"].date_added,
				articles: topicToRender.articles
			};
			next();
		} else {
			next(createError(404));
		};
	});
});

app.get('*', (req, res) => {
	let dataDefinition = '';
	if (res.locals.topicsData) {
    	dataDefinition += `window.topics = ${JSON.stringify(res.locals.topicsData)};\n`;
    };
    if (res.locals.topicData) {
    	dataDefinition += `window.topic = ${JSON.stringify(res.locals.topicData)};\n`;
    };

	res.send(`
	  	<html>
			<head>
				<meta charset="UTF-8">
				<title>NewsRank</title>
				<link href="http://netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.css" rel="stylesheet">
				<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"/>
				<script src="http://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.js"></script>
				<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
				<script src="http://netdna.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.js"></script></head>
				<script src="/javascripts/summernote.js"></script>
				<script>
					${dataDefinition}
				</script>
			<body>
			  <div id="root"></div>
			  <script src="/bundle.js"></script>
			</body>
		</html>
	`);
});

app.use('/api', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// app.use((err, req, res, next) => {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.send(err)
// });

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
  });
module.exports = app;
