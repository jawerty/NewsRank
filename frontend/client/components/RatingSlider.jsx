import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

import { redGreenScale } from '../../lib/redGreenScale';

class RatingSlider extends Component {
  constructor(props) {
  	super(props);

  }

  addPercentage(value) {
    return value+"%";
  }

  handleRatingChange(value) {
    this.props.updateRating(value);
  }



  componentDidMount() {
  	// Slider component doesnt have a style property for the filling
  	document.getElementsByClassName('rangeslider__fill')[0].style.backgroundColor = redGreenScale(this.props.rating);	 
  }
  
  componentDidUpdate() {
  	document.getElementsByClassName('rangeslider__fill')[0].style.backgroundColor = redGreenScale(this.props.rating);
  }

  render() {
    return  (
	    <Slider
          value={this.props.rating}
          format={this.addPercentage}
          onChange={this.handleRatingChange.bind(this)}
         />
  	);
  }
}

RatingSlider.propTypes = {
	rating: Proptypes.number,
	updateRating: Proptypes.func
}

export default RatingSlider;