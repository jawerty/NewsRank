import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import { Editor } from 'react-draft-wysiwyg';
import { EditorState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const toolbar = {
  options: ['inline', 'fontSize', 'fontFamily', 'list', 'textAlign'],
  inline: {
    inDropdown: false,
    options: ['bold', 'italic', 'underline', 'strikethrough']
  },
  list: {
    inDropdown: true,
    options: ['unordered', 'ordered', 'indent', 'outdent']
  },
  textAlign: {
    inDropdown: true,
    options: ['left', 'center', 'right', 'justify']
  },
};

class ReviewEditor extends Component {
  constructor(props) {
  	super(props);
  	this.state = {
  		rating: 80,
  		editorState: EditorState.createEmpty()
  	};
  }

  addPercentage(value) {
    return value+"%";
  }

  handleRatingChange(value) {
    this.setState({
      rating: value
    });
  }

  onEditorStateChange(editorState) {
    this.setState({
      editorState
    });
  }

  render() {
    return  (
	    <Editor
		  editorState={this.state.editorState}
		  toolbarClassName="review-editor-toolbar"
		  wrapperClassName="review-editor-wrapper"
		  editorClassName="review-editor"
		  onEditorStateChange={this.onEditorStateChange.bind(this)}
		  toolbar={toolbar}
		/>
  	);
  }
}

ReviewEditor.propTypes = {

}

export default ReviewEditor;