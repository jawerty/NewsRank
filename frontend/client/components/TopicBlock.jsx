import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Link
} from 'react-router-dom'
import { getDateFromTs } from '../../lib/time';

class TopicBlock extends Component {
	render() {
		const topicBlockImageStyle = {
			backgroundImage: `url(${this.props.topic.headlineImage})`
		};
		const coveredBy = this.props.topic.coveredBy;
		let coveredByPreview = '';
		for (let i = 0; i <= 3; i++) {
			if (i == 1 && i == coveredBy.length-1) {
				coveredByPreview += ` and ${coveredBy[i]}`;
				break;
			} else if (i == coveredBy.length-1) {
				coveredByPreview += `${coveredBy[i]}`;
				break;
			}

			if (i == 3) {
				coveredByPreview += ` and ${coveredBy.length-3} more`;
				break;
			} else {
				coveredByPreview += `${coveredBy[i]}, `;
			};
		};

		const topicState = { topic: this.props.topic };
		return (
			<div className="topicBlock">
				<Link to={{
					pathname: `/topic/${this.props.topic.slug}`,
					state: topicState
				}}>
					<div className="topicBlockImage" style={topicBlockImageStyle}>
					</div>
				</Link>
				<div className="topicBlockContent">
					<Link to={{
						pathname: `/topic/${this.props.topic.slug}`,
						state: topicState
					}}>
						<h3>{this.props.topic.name}</h3>
					</Link>
					<label className="coveredBy">Covered by {coveredByPreview}</label>						
					<label className="timestamp">Retrieved on {getDateFromTs(this.props.topic.date_added)}</label>						
				</div>
			</div>
		);
	}
}

TopicBlock.propTypes = {
  topic: PropTypes.object,
}

export default TopicBlock;