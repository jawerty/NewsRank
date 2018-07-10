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

let shownNGBanner = false;
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if (shownNGBanner) {
  		sendResponse({received: true});
  		return;
  	}
  	let localHostName = extractHostname(window.location.href);
  	if (request.hostname.indexOf("www.") == 0) {
		request.hostname = request.hostname.substring(4);
	}
	if (localHostName.indexOf("www.") == 0) {
		localHostName = localHostName.substring(4);
	}
   if (localHostName == request.hostname) {
		if (request.showBanner == true) {
			console.log(request.title)
			const title = (request.title.length > 50) ? request.title.substring(0, 50)+'...' : request.title;
			const reason = request.topReason ? " because <label style='font-weight: bold; color: #fff'>"+request.topReason+"</label>" : '';
			const container = document.createElement('div');
			container.style.padding = "15px 25px";
			container.style.backgroundColor = "rgba(207,70,71,.7)";
			container.style.fontSize = "16px";
			container.style.fontFamily = "sans-serif";
			container.style.color = "rgb(255,255,255)";
			container.style.textAlign = "center";
			container.innerHTML = "Newsgate redirected you from '<a style='color: #fff; text-decoration: underline' href='"+request.link+"'>"+title+"'</a> by "+request.publicationName+reason;
			document.body.appendChild(container);
			document.body.insertBefore(container, document.body.firstChild);
			shownNGBanner = true;
		}
   		sendResponse({received: true});
   } 
});
