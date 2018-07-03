import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Link
} from 'react-router-dom';

import TopicBlock from "./TopicBlock.jsx";

import { redGreenScale } from '../../lib/redGreenScale';

class HomePage extends Component {
  render() {
  	const topicBlocks = this.props.topics.map((topic) => {
  		return <TopicBlock topic={topic} />;
  	});
  	
  	const pubPanelBlocks = this.props.pubPanelData.map((pubWithRating) => {
  		const pubPanelBlockStyle = {
  			backgrowundColor: redGreenScale(pubWithRating.avgRating)
  		}
  		return (
  			<div class="pubPanelBlock" style={pubPanelBlockStyle}>
  				<img src={`//logo.clearbit.com/${pubWithRating._id.publication}`}></img>
  			</div>
  		);
  	});
    return  (
    	<div>
    		<div class="pubPanel">
    			{pubPanelBlocks}
    		</div>
			<div class="topics">
			  <div class="section-header"> 
			    {/*<ul>
			      <li> 
			        <h2>All Topics</h2>
			      </li>
			      <li> <a href="/?filter=recent">Recent</a></li>
			      <li> 
			        <input placeholder="Search..." id="searchTextBox" onkeyup="searchForTopics(this)"/>
			      </li>
			    </ul>*/}
			  </div>
			  {topicBlocks}
			</div>
			<div class="loadingGif"></div>
		</div>
  	);
  }
}

HomePage.propTypes = {
	topics: PropTypes.array,
	pubPanelData: PropTypes.array
}

export default HomePage;