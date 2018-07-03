const data = {}
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if ("badArticle" in request) {
    	data.badArticle = request.badArticle;
    	data.goodArticle = request.goodArticle;
    	console.log(data.goodArticle);
    	document.getElementById('badArticle').innerHTML = data.badArticle;
    	document.getElementById('goodArticle').innerHTML = data.goodArticle.origin;
    	document.getElementById('goodArticle').setAttribute('href', data.goodArticle.origin)
    	sendResponse({received: true});
    }
});
