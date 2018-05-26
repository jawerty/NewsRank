import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Link
} from 'react-router-dom';
	  
import RatingSlider from "./RatingSlider.jsx";
//"Review the quality of this article. Is it credible? Is it well sourced?"
import ReviewEditor from "./ReviewEditor.jsx";

class TopicPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
    	selectedArticle: this.props.topic.articles[0],
    	rating: 80,
    	editorState: "Write a review",
    	reviewContent: null
    };
  }

  articleRowClick(e, selectedArticle) {
	if (e.target.tagName == "A") {
    	return
    }
    this.setState({selectedArticle});
  }

  updateRating(rating) {
  	this.setState({rating});
  }

  updateReviewContent(reviewContent) {
  	this.setState({reviewContent});
  }

  submitReviewForm() {
  	console.log(this.state.selectedArticle);
	$.ajax({
		type: 'POST',
		url: '/api/save-review',
		contentType: 'application/json',
		data: JSON.stringify({ 
			"rating": this.state.rating,
			"articleSlug": this.state.selectedArticle.publicationSlug,
			"topicSlug": this.props.topic.slug,
			"publication": this.state.selectedArticle.publication,
			"reviewer": "guest",
			"reviewContent": this.state.reviewContent 
		}),
		success: () => {
			console.log("Review has been saved.");
		}
	});
  }

  render() {
  	const articles = this.props.topic.articles;
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

    return  (
    	<div class="topicView">
		  <div class="left">
		    <table class="topicLinks">
		      {articlesRows}
		    </table>
		  </div>
		  <div class="right">
		    <label id="review-pabel-label">Review Article</label>
		    <h2 id="chosenArticleTitle">{this.state.selectedArticle.title}</h2>
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
		  <div class="reviewList"></div>
		</div>
  	);
  }
}

TopicPage.proptypes = {
	topic: PropTypes.object
};

export default TopicPage;