import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

class ReviewList extends Component {
  constructor(props) {
  	super(props)
  }

  render() {
	return (
  		<div></div>
	);
  }
}

ReviewList.propTypes = {
	reviews: Proptypes.array,
}
export default ReviewList;