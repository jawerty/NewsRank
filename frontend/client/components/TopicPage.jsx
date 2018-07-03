import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Link
} from 'react-router-dom';
	  
import RatingSlider from "./RatingSlider.jsx";
//"Review the quality of this article. Is it credible? Is it well sourced?"
import ReviewEditor from "./ReviewEditor.jsx";
import ReviewList from "./ReviewList.jsx";

class TopicPage extends Component {
  constructor(props) {
    super(props);
    let selectedArticle = {};
    if (this.props.topic) {
		selectedArticle = this.props.topic.articles[0];
    }
    let topic = this.props.topic;
    if (topic && topic.slug != this.props.match.params.topicName) {
    	topic = null;
    }
    this.state = {
    	topic,
    	selectedArticle,
    	rating: 80,
    	editorState: "Write a review",
    	reviewContent: null,
    	reviews: []
    };
  }

  articleRowClick(e, selectedArticle) {
  	const self = this;
	if (e.target.tagName == "A") {
    	return
    }
    self.props.fetchReviews(selectedArticle.publicationSlug, (reviews) => {
    	self.setState({selectedArticle, reviews});
    });
  }

  updateRating(rating) {
  	this.setState({rating});
  }

  updateReviewContent(reviewContent) {
  	this.setState({reviewContent});
  }

  componentWillMount() {
  	const self = this;
  	const param = this.props.match.params.topicName;
  	console.log(param);
  	if (param && (!this.state.topic || 
  		this.state.topic.slug != param)) {
  		this.props.fetchTopic(this.props.match.params.topicName, (topic) => {
  			self.props.fetchReviews(topic.articles[0].publicationSlug, (reviews) => {
		    	self.setState({topic, selectedArticle: topic.articles[0], reviews});
		    });
  		});
  	} else {
  		console.log(this.state.selectedArticle);
  		this.props.fetchReviews(this.state.selectedArticle.publicationSlug, (reviews) => {
	    	self.setState({reviews});
	    });
  	}
  }

  submitReviewForm() {
	$.ajax({
		type: 'POST',
		url: '/api/save-review',
		contentType: 'application/json',
		data: JSON.stringify({ 
			"rating": this.state.rating,
			"articleSlug": this.state.selectedArticle.publicationSlug,
			"topicSlug": this.state.topic.slug,
			"publication": this.state.selectedArticle.publication,
			"reviewer": "guest",
			"reviewContent": this.state.reviewContent 
		}),
		success: () => {
			alert("Review saved");
		}
	});
  }

  render() {
  	let articles = [];
  	if (this.state.topic) {
  		articles = this.state.topic.articles;
  	}

	const articlesRows = []; // make a component
	for (let i = 0; i < articles.length; i++) {
		articlesRows.push(
			<tr class="articleRow" onClick={((e) => this.articleRowClick(e, articles[i]))}>
				<th>
					<label class="publication">{articles[i].publication}</label>
				</th>
				<th><a class="title" href={articles[i].origin}>{articles[i].title}</a></th>
			</tr>
		);
	};

	const chosenArticleImageStyle = {
		backgroundImage: `url(${this.state.selectedArticle.headlineImage})`
	};

    return  (
    	<div class="topicView">
		  <div class="left">
		    <table class="topicLinks">
		      {articlesRows}
		    </table>
		  </div>
		  <div class="right">
		    <label id="review-pabel-label">Review Article</label>
		    <a href={this.state.selectedArticle.origin}>
		    	<div id="chosenArticleImage" style={chosenArticleImageStyle}></div>
		    </a>
		    <a href={this.state.selectedArticle.origin}>
		    	<h2 id="chosenArticleTitle">{this.state.selectedArticle.title}</h2>
		    </a>
		    <label id="chosenArticlePub">- {this.state.selectedArticle.publication}</label><br/>
		    <div id="reviewForm">
		      <h2>Rate article</h2>
		      <RatingSlider 
		      	rating={this.state.rating}
		      	updateRating={this.updateRating.bind(this)}/>
		      <h2>Review article</h2>
		      <ReviewEditor
		      	reviewContent={this.state.reviewContent}
		      	updateReviewContent={this.updateReviewContent.bind(this)}/>
		      <h2>or Link to pre-written review</h2>
		      <input type="text" placeholder="URL" id="review-link"/>
		      <button className="reviewSubmit" onClick={this.submitReviewForm.bind(this)}>
		      	Review
		      </button>
		    </div>
		  </div>
		  <ReviewList reviews={this.state.reviews} articleTitle={this.state.selectedArticle.title}/>
		</div>
  	);
  }
}

TopicPage.proptypes = {
	topic: PropTypes.object,
	renderedReviews: PropTypes.array,
	fetchReviews: PropTypes.func,
	fetchTopic: PropTypes.func,
	location: PropTypes.object
};

export default TopicPage;