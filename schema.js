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
	date_scrapped: {type: Date, required: true},
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
  articlePreview: {type: String}
});

const topicSchema = new Schema({
  id: ObjectId,
  date_added: {type: Date, default: Date.now},
  name: {type: String, required: true},
  articles: [ObjectId],
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
  article: ObjectId,
  reviewer: ObjectId,
  rating: {type: Number},
});

const userSchema = new Schema({
  id: ObjectId,
  article: ObjectId,
  username: {type: String},
  password: {type: String},
  reviews: [ObjectId]
});

mongoose.model('article', articleSchema, 'article');
mongoose.model('topic', topicSchema, 'topic');
mongoose.model('topicStack', topicStackSchema, 'topicStack');
mongoose.model('review', reviewSchema, 'review');
mongoose.model('user', userSchema, 'user');

articleSchema.index({publicationSlug: 1, origin: 1});
module.exports = mongoose;