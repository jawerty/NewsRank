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
	'https://www.theblaze.com/'
]

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

chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
	if (changeInfo.status === "loading") {
	    // logic for checking white list, using tab.url
	    chrome.tabs.query({'active': true, 'lastFocusedWindow': true},  (tabs) => {
		    // get current active tabs url
		    if (!tabs[0]) {
		    	return;
		    }
		    const requestedUrl = tabs[0].url;
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
					    if (xhr.readyState == XMLHttpRequest.DONE) {
					        const response = JSON.parse(xhr.responseText);
					        if (response["suggestions"]) {
						        chrome.tabs.update(tabId, { url: 'fork.html' }, () => {
					    			const interval = setInterval(() => {
					    				chrome.tabs.sendMessage(tabId, { 
					    					badArticle: requestedUrl,
					    					goodArticle: response["suggestions"][0]
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
					}
					xhr.open("GET", "http://localhost:8080/suggestArticle?url="+parsedUrl, false);
					xhr.send();

					const result = xhr.responseText;
					
					
		    	}
		    	
		    });
		});
	}
})