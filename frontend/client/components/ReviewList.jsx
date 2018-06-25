import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import { redGreenScale } from "../../lib/redGreenScale";

class ReviewList extends Component {
  constructor(props) {
  	super(props);
  }

  render() {
  	const reviewBlocks = this.props.reviews.map((review) => {
  		const ratingLabelStyle = {
  			color: redGreenScale(review.rating)
  		};

  		return (
  			<div class="reviewBlockWrapper">
	  			<tr className="reviewBlock">
	  				<td className="reviewPub">
	  					{review.publication}: <span style={ratingLabelStyle}>{review.rating + "%"}</span>
	  				</td>
	  				<td className="reviewContent" dangerouslySetInnerHTML={{__html: review.reviewContent}}>
	  				</td>
	  			</tr>
	  			<tr class="reviewBlockSpacing"></tr>	
  			</div>		
  		);
  	});

  	let reviewListContent;
  	if (reviewBlocks.length > 0) {
  		reviewListContent = (
  			<div>
	  			<h2>Reviews for <label>{this.props.articleTitle}</label></h2>
	  			<table>
	  				<tr class="reviewBlockSpacing"></tr>
	  				{reviewBlocks}
	  			</table>
  			</div>
  		);
  	} else {
  		reviewListContent = (
  			<div>
  				<h2>No reviews yet for this article.</h2>
  			</div>
  		)
  	}
	return (
		<div id="reviewList">
  			{reviewListContent}
  		</div>
	);
  }
}

ReviewList.propTypes = {
	reviews: Proptypes.array,
	articleTitle: Proptypes.string
}
export default ReviewList;