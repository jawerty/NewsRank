const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// const publicationChange = (e) => {
// 	const publication = e.value;
// 	if (publication == 'default') {
// 		window.location = '/';
// 	} else {
// 		window.location = '/?filter=pub-'+publication;
// 	}
// }
const redGreenScale = (percentage, alpha) => {
	const A = (alpha) ? alpha : 1;
	const low = 100;
	const high = 225;
	const B = low;
	if (percentage == 100) {
	  return `rgba(${low},${high},${low},${A})`;
	}  else if (percentage == 0) {
	  return `rgba(${high},${low},${low},${A})`;
	};

	const denomination = (high-low)/100;
	const value = percentage*denomination;
	const offset = (100-percentage)*denomination;

	const R = low + offset
	const G = low + value;
	const rgbValue = `rgba(${parseInt(R)}, ${parseInt(G)}, ${parseInt(B)}, ${A})`;
	return rgbValue;
}

const searchForTopics = (e) => {
	document.getElementsByClassName('loadingGif')[0].style.display = "block";
	const searchInterval = setInterval(() => {
		clearInterval(searchInterval);
		delete window.skip;
		document.querySelectorAll(".topics .topic").forEach(
			e => e.parentNode.parentNode.removeChild(e.parentNode)
		);
		getNewTopics("search-"+e.value, () => {
			document.getElementsByClassName('loadingGif')[0].style.display = "none";
		});	
	}, 500);
}

const getNewTopics = (filter, callback) => {
	const limit = 16;
	const skip = window.skip;
	const skipValue = (typeof skip == "number") ? parseInt(skip) + limit : 0;
	window.skip = skipValue;
	console.log(skip)
	const filterString = (filter) ? "filter="+filter : '';

	const url = '/?skip='+skipValue+"&fetch=true&"+filterString;
	var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200 || xmlhttp.status == 304) {
            	const topics = JSON.parse(xmlhttp.responseText).topics;
            	if (topics) {
	            	const topicView = document.getElementsByClassName('topics')[0];
	            	for (let i = 0; i < topics.length; i++) {
	                    const aTag = document.createElement('a');
	               		aTag.href = "/topic/" + topics[i].slug;
	               		aTag.setAttribute('class', "topicBlock");
	               		const divTag = document.createElement('div');
	               		divTag.setAttribute('class', "topic");
	        			divTag.innerHTML = topics[i].name;
	        			aTag.appendChild(divTag)
	        			topicView.appendChild(aTag);
	               	}	
	               	if (callback) {
	               		callback();
	               	}
            	}
            } else {
               console.log('Error fetching topics:', xmlhttp.status, xmlhttp.responseText);
            }
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

window.onscroll = (ev) => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight
  	&& document.getElementById('searchTextBox')) {
  	const searchQuery = document.getElementById('searchTextBox').value;
  	if (searchQuery && searchQuery.length > 0 ) {
  		getNewTopics("search-"+searchQuery);
  	} else {
  		getNewTopics(getParameterByName('filter'));
  	};
  }
};