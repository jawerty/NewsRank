import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

class ReviewEditor extends Component {
  constructor(props) {
  	super(props);
  }

  handleEditorChange(content) {
  	this.props.updateReviewContent(content);
  };
  render() {
    return  (
	    <ReactQuill value={this.props.reviewContent}
                  onChange={this.handleEditorChange.bind(this)} 
                  modules={{
				    toolbar: [
				      [{ 'size': ['small', false, 'large', 'huge'] }],
				      ['bold', 'italic', 'underline','strike', 'blockquote'],
				      [{'list': 'ordered'}, {'list': 'bullet'}],
				      ['link', 'image'],
				      ['clean']
				    ],
				  }}/>
  	);
  }
}

ReviewEditor.propTypes = {
	reviewContent: Proptypes.string,
	updateReviewContent: Proptypes.func
}

export default ReviewEditor;