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
  		topics: this.props.topics
  	};
  }
  // fetch if another page has been cached
  // needs to be worked on more
  fetchTopics(callback) { 
  	$.ajax({
	  url: '/?fetch=true',
	  success: (data) => {
	  	callback(data);
	  },
	});
  }

  componentDidMount() {
  	const self = this;
  	if (!self.state.topics) {
  		console.log("ok")
		self.fetchTopics((topics) => {
			self.setState({ topics })
		});
  	}
  }


  render() {
	return (
  		<Router>
	    	<div>
		    	<header>
					<ul> 
						<li>
							<Link to={{
								pathname: "/",
								state: { topics: this.state.topics }
							}}><h1 className="title">NewsRank</h1></Link>
							<p className="subtitle">"Review top stories in the news"</p>
						</li>
					</ul>
				</header>
				<div>
					<Route exact path="/" render={(props) => (
						(this.state.topics) ? <HomePage topics={this.state.topics || props.location.state.topics}/> : function(){}
					)}/>	
					<Route path="/topic/:topicName" render={(props) => (
						<TopicPage topic={this.props.topic || props.location.state.topic}/>
					)}/>
				</div>
			</div>
		</Router>
	);
  }
}

App.propTypes = {
	topics: Proptypes.array,
	topic: Proptypes.object
}
export default App;