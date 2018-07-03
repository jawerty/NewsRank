import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import HomePage from './HomePage.jsx';
import TopicPage from './TopicPage.jsx';

class App extends Component {
  constructor(props) {
  	super(props)

  	this.state = {
  		topics: this.props.topics,
  		pubPanelData: this.props.pubPanelData,
  		topic: this.props.topic || {}
  	};
  }

  // fetch if another page has been cached
  // needs to be worked on more
  fetchTopics(callback) { 
  	console.log("Fetching all topics");
  	$.ajax({
	  url: '/?fetch=true&ppData=true',
	  success: (data) => {
	  	callback(data);
	  },
	});
  }

  fetchTopic(topicSlug, callback) { 
  	console.log(`Fetching topic ${topicSlug}`);
  	$.ajax({
	  url: `/api/topic/${topicSlug}`,
	  success: (data) => {
	  	callback(data);
	  },
	});
  }

  fetchReviews(articleSlug, callback) { 
  	console.log(`Fetching reviews for ${articleSlug}`);
  	$.ajax({
	  url: `/api/reviews?articleSlug=${articleSlug}`,
	  success: (data) => {
	  	callback(data);
	  },
	});
  }

  componentDidMount() {
  	const self = this;
  	if (!self.state.topics) { // check only if hitting / route
		self.fetchTopics((data) => {
			self.setState({ 
				topics: data.topics,
				pubPanelData: data.pubPanelData
			})
		});
  	}
  }

  render() {
	return (
  		<Router>
	    	<div id="wrapper">
		    	<header>
					<ul> 
						<li>
							<Link to={{
								pathname: "/",
								state: { topics: this.state.topics }
							}}><h1 className="title">newsrank.</h1></Link>
							{/*	<p className="subtitle">"Review top stories in the news"</p> */}
						</li>
					</ul>
				</header>
				<div>
					<Route exact path="/" render={(props) => (
						(this.state.topics) ? <HomePage {...props} 
												topics={this.state.topics || props.location.state.topics}
												pubPanelData={this.state.pubPanelData}/> : function(){}
					)}/>	
					<Route path="/topic/:topicName" render={(props) => (
						<TopicPage 
							{...props}
							topic={this.props.topic || null}
							renderedReviews={this.props.reviews}
							fetchReviews={this.fetchReviews}
							fetchTopic={this.fetchTopic}/>
					)}/>
				</div>
			</div>
		</Router>
	);
  }
}

App.propTypes = {
	topics: Proptypes.array,
	topic: Proptypes.object,
	pubPanelData: Proptypes.array
}
export default App;