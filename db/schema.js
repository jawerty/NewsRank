const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const db_url = process.env.MONGOPROD_URI || "mongodb://localhost:27017/storybreak";
mongoose.connect(db_url);
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'Mongodb Connection Error:'));
conn.on('connected', () => {
  console.log("Mongoose Successfully Connected");
});

const articleSchema = new Schema({
	id: ObjectId,
	date_scrapped: {type: Number, required: true},
	title: {type: String, required: true},
  byline: {type: String},
	content: {type: String, required: true},
  origin: {type: String},
  publication: {type: String},
  headlineImage: {type: String},
  thumbnail: {type: String},
  publicationSlug: {type: String},
  tokens: [{type: String}],
  trained: {type: Boolean},
  icon: {type: String},
  articlePreview: {type: String},
  credibility: {type: Object},
  publicationName: {type: String}
});

const topicSchema = new Schema({
  id: ObjectId,
  date_added: {type: Date, default: Date.now},
  name: {type: String, required: true},
  articles: [ObjectId],
  coveredBy: [{type: String}],
  summary: {type: String}, // summary of greatest
  slug: {type: String},
  headlineImage: {type: String} // first headline image in articles
});

const topicStackSchema = new Schema({
  id: ObjectId,
  topics: [ObjectId] // should be in chronological order
});

const categorySchema = new Schema({
  id: ObjectId,
  topics: [ObjectId], // should be in chronological order
  name: {type: String}
});

const reviewSchema = new Schema({
  id: ObjectId,
  date_added: {type: Date, default: Date.now},
  articleSlug: {type: String}, // deciding whether to only use slug or objectid for reference
  topicSlug: {type: String},
  publication: {type: String},
  reviewer: {type: String},
  reviewContent: {type: String},
  rating: {type: Number},
});

const userSchema = new Schema({
  id: ObjectId,
  article: ObjectId,
  username: {type: String},
  password: {type: String},
  reviews: [ObjectId]
});

trackerInfoSchema = new Schema({
  id: ObjectId,
  publication: {type: String},
  trackerList: [{type: String}]
});

mongoose.model('article', articleSchema, 'article');
mongoose.model('topic', topicSchema, 'topic');
mongoose.model('topicStack', topicStackSchema, 'topicStack');
mongoose.model('review', reviewSchema, 'review');
mongoose.model('user', userSchema, 'user');
mongoose.model('trackerInfo', trackerInfoSchema, 'trackerInfo');

articleSchema.index({publicationSlug: 1, origin: 1});
module.exports = mongoose;