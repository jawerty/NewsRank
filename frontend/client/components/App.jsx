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
  render() {
    return  (
    <Router>
    	<div>
	    	<header>
				<ul> 
					<li>
						<h1 className="title">NewsRank</h1>
						<p className="subtitle">"Review top stories in the news"</p>
					</li>
				</ul>
			</header>
			<div>
				<Route exact path="/" render={(props) => (
					<HomePage topics={this.props.topics}/>
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