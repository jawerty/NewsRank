const sites_being_scrapped = [
	'http://nytimes.com',
	'http://buzzfeed.com/news',
	'http://huffingtonpost.com',
	'http://www.washingtonpost.com',
	'http://thehill.com',
	'http://www.politico.com/',
	'http://www.cnn.com/us',
	'http://www.reuters.com/',
	'http://www.theguardian.com/us',
	'http://www.theatlantic.com/',
	'https://www.nbcnews.com',
	'http://www.latimes.com/',
	'https://www.independent.co.uk/us',
	'http://www.newsweek.com/',
	'http://www.businessinsider.com/',
	'http://www.thedailybeast.com/',
	'https://slate.com/news-and-politics',
	'http://www.bbc.com/',
	'https://news.vice.com/en_us',
	'http://abcnews.go.com/',
	'https://www.npr.org/',
	'https://www.vox.com/',
	'http://nymag.com/',
	'https://www.cbsnews.com/',
	'http://www.foxnews.com/',
	'https://www.usatoday.com/',
	'http://www.motherjones.com/',
	'http://time.com/',
	'https://www.wsj.com/',
	'https://www.yahoo.com/news/',
	'https://www.bloomberg.com/',
	'https://www.aljazeera.com/topics/regions/us-canada.html',
	'http://www.nydailynews.com/',
	'https://www.cnbc.com/',
	'https://breitbart.com',
	'https://www.infowars.com/',
	'http://bipartisanreport.com/',
	'https://www.theblaze.com/',
	'https://www.thenation.com/',
	'http://theweek.com/',
	'https://www.buzzfeednews.com/',
	'http://thefederalist.com/',
	'https://www.redstate.com/',
	'https://www.nationalreview.com/'
];

let urls_hit = [];
function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

let lastInitiator = null;
let lastInitiatorIgnore = false;


chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
	if (changeInfo.status === "loading") {
		chrome.storage.sync.get(null, function(data) {
			const disable = data.newsblock_disable;
			const isAuto = data.newsblock_auto || false;
			let showBanner = data.newsblock_banner || false;
			const hasLowMode = data.newsblock_low || false;
			console.log(data);
			if (disable != "on") {
				const requestedUrl = tab.url;
				console.log(urls_hit, requestedUrl)
				if (requestedUrl.indexOf("nb_force=true") > -1
					// || urls_hit.indexOf(requestedUrl) > -1
					) {
					return;
				}
				let hostname = extractHostname(requestedUrl);

			    if (hostname.indexOf("www.") == 0) {
			    	hostname = hostname.substring(4);
			    }

			    sites_being_scrapped.forEach(function(site) {
			    	if (site.indexOf(hostname) > -1) {
			    		let parsedUrl = requestedUrl.split("?")[0].split("://")[1];
			    		if (parsedUrl.indexOf("www.") == 0) {
			    			parsedUrl = parsedUrl.substring(4);
			    		}
			    		const xhr = new XMLHttpRequest();
						xhr.onreadystatechange = function() {
						    if (xhr.readyState != XMLHttpRequest.DONE) {
						        return;
						    }
						    const response = JSON.parse(xhr.responseText);
						    console.log(response);
					        if (!response["suggestions"]) {
								return;
					        }
					        // if (urls_hit.length >= 25) {
					        // 	urls_hit.shift();
					        // }
					        // urls_hit.push(response["suggestions"][0].origin);
						    const distances = response["suggestions"].map(function(tempArticle) {
						    	console.log(
						    		Levenshtein.get(
							    		response["received"].title,
							    		tempArticle.title
						    		),
						    		response["received"].title,
						    		tempArticle.title
						    	);
						    	return Levenshtein.get(
						    		response["received"].title,
						    		tempArticle.title
						    	);
						    });
						    const lowestDistanceIndex = distances.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
							suggestion = response["suggestions"][lowestDistanceIndex];
						    if (isAuto == "on") {
						    	let nb_force = '?nb_force=true"';
						    	if (suggestion.origin.indexOf('?') > -1) {
						    		nb_force = "&nb_force=true";
						    	}

						    	chrome.tabs.update(tabId, { url: suggestion.origin + nb_force  }, () => {
						    		if (showBanner == "on") {
						    			showBanner = true;
						    		}
						    		let topReason = null;
						    		if (response["received"].credibility.reasons.length > 0) {
						    			topReason = response["received"].credibility.reasons[0];
						    		};
						    		const interval = setInterval(() => {
						    			chrome.tabs.sendMessage(tabId, {
							    			showBanner,
							    			title: response["received"].title,
							    			link: response["received"].origin + "?nb_force=true",
							    			publicationName: response["received"].publicationName,
							    			topReason,
							    			hostname: extractHostname(suggestion.origin)
							    		}, (response) => {
											if (typeof response != 'undefined' && response.received) {
												urls_hit.push(response.receivedUrl)
												clearInterval(interval);
											}
										});
						    		}, 100);
						    	});
						    } else {
							    chrome.tabs.update(tabId, { url: 'fork.html' }, () => {
					    			const interval = setInterval(() => {
					    				chrome.tabs.sendMessage(tabId, { 
					    					badArticle: response["received"],
					    					goodArticle: suggestion
					    				}, (response) => {
											console.log(response);
											if (typeof response != 'undefined' && response.received) {
												clearInterval(interval);
											}
										});
						    		}, 100);	
					    		});	
						    }
						        
						}
						let options = "";
						console.log(hasLowMode);
						if (hasLowMode == "on") {
							options += "&lowMode=true";
						}
						xhr.open("GET", "http://206.189.206.71:8080/suggestArticle?url="+parsedUrl+options, false);
						xhr.send();

						const result = xhr.responseText;
						
						
			    	}
			    	
			    });
			}
		});
	}
});
