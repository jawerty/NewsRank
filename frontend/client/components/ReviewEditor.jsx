import React, { Component } from 'react';
import Proptypes from 'prop-types';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import { Editor } from 'react-draft-wysiwyg';
import { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
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
  		editorState: EditorState.createEmpty()
  	};
  }

  onEditorStateChange(editorState) {
    const currentContent = this.state.editorState.getCurrentContent();
  	//send up to parent state 
    this.props.updateReviewContent(stateToHTML(currentContent));
    this.setState({
      editorState
    });
  };

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
	reviewContent: Proptypes.string,
	updateReviewContent: Proptypes.func
}

export default ReviewEditor;