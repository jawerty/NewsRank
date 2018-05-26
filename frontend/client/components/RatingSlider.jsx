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
  	this.state = {
  		rating: 80
  	}
  }

  addPercentage(value) {
    return value+"%";
  }

  handleRatingChange(value) {
    this.setState({
      rating: value
    })
  }

  componentDidMount() {
	 document.getElementsByClassName('rangeslider__fill')[0].style.backgroundColor = redGreenScale(this.state.rating);
  }
  
  componentDidUpdate() {
	 document.getElementsByClassName('rangeslider__fill')[0].style.backgroundColor = redGreenScale(this.state.rating);
  }

  render() {
    return  (
	    <Slider
          value={this.state.rating}
          format={this.addPercentage}
          onChange={this.handleRatingChange.bind(this)}
         />
  	);
  }
}

RatingSlider.propTypes = {

}

export default RatingSlider;