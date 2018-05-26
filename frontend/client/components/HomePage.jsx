import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Link
} from 'react-router-dom';

import TopicBlock from "./TopicBlock.jsx";

class HomePage extends Component {
  render() {
  	const topicBlocks = this.props.topics.map((topic) => {
  		return <TopicBlock topic={topic} />;
  	});
  	
    return  (
    	<div>
			<div class="topics">
			  <div class="section-header"> 
			    <ul>
			      <li> 
			        <h2>All Topics</h2>
			      </li>
			      <li> <a href="/?filter=recent">Recent</a></li>
			      <li> 
			        <input placeholder="Search..." id="searchTextBox" onkeyup="searchForTopics(this)"/>
			      </li>
			    </ul>
			  </div>
			  {topicBlocks}
			</div>
			<div class="loadingGif"></div>
		</div>
  	);
  }
}

HomePage.propTypes = {
	topics: PropTypes.array
}

export default HomePage;