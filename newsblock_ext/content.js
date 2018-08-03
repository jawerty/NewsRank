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

let shownNBBanner = false;


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let receivedUrl = request.link;
    if (request.link.indexOf('?nb_force=true') > -1) {
      receivedUrl = receivedUrl.substring(0, request.link.indexOf('?nb_force=true'))
    } else if (request.link.indexOf('&nb_force=true') > -1) {
      receivedUrl = receivedUrl.substring(0, request.link.indexOf('&nb_force=true'))
    }
    console.log(receivedUrl);
  	if (shownNBBanner) {
  		sendResponse({received: true, receivedUrl});
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

        let iterator = 0
        let renderInterval = setInterval(function() {
          iterator++;
          if (document.body && !shownNBBanner) {
            console.log(request.title)
            const title = (request.title.length > 50) ? request.title.substring(0, 50)+'...' : request.title;
            const reason = request.topReason ? " because <label style='font-weight: bold; color: #fff'>"+request.topReason+"</label>" : '';
            const container = document.createElement('div');
            container.style.padding = "15px 25px";
            container.style.backgroundColor = "rgba(71,70,207,.7)";
            container.style.fontSize = "16px";
            container.style.fontFamily = "sans-serif";
            container.style.color = "rgb(255,255,255)";
            container.style.textAlign = "center";
            container.innerHTML = "Newsblock redirected you from '<a style='color: #fff; text-decoration: underline' href='"+request.link+"'>"+title+"'</a> by "+request.publicationName+reason;
            document.body.appendChild(container);
            document.body.insertBefore(container, document.body.firstChild);
            shownNBBanner = true;
            clearInterval(renderInterval);
          } else if (iterator > 10) {
            clearInterval(renderInterval);            
          }
        }, 100);
  			
  		}
   		sendResponse({received: true, receivedUrl});
   } 
});
