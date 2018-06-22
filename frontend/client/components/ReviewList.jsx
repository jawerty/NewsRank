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
  	super(props)
  }

  render() {
  	const reviewBlocks = this.props.reviews.map((review) => {
  		const ratingLabelStyle = {
  			color: redGreenScale(review.rating)
  		};

  		return (
  			<div className="reviewBlock">
  				<div className="reviewPub">
  					{review.publication} : <label style={ratingLabelStyle}>
  						{review.rating + "%"}
  					</label>
  				</div>
  				<div className="reviewContent" dangerouslySetInnerHTML={{__html: review.reviewContent}}>
  				</div>
  			</div>			
  		);
  	});

  	let reviewListContent;
  	if (reviewBlocks.length > 0) {
  		reviewListContent = (
  			<div>
	  			<h2>Reviews</h2>
	  			{reviewBlocks}
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
		<div>
  			{reviewListContent}
  		</div>
	);
  }
}

ReviewList.propTypes = {
	reviews: Proptypes.array
}
export default ReviewList;