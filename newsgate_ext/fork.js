const data = {}
data.rendered = false;
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
	console.log(request);
    if ("badArticle" in request && !data.rendered) {
    	data.badArticle = request.badArticle;
    	data.goodArticle = request.goodArticle;
    	const badArticleTitle = document.getElementById('badArticleTitle');
    	const badArticlePub = document.getElementById('badArticlePub');
    	const goodArticleLink = document.getElementById('goodArticleLink');
    	const goodArticleImage = document.getElementById('goodArticleImage');
    	const goodArticlePreview = document.getElementById('goodArticlePreview');
    	const fromLineText = document.getElementById('fromLineText');
    	const fromLineIcon = document.getElementById('fromLineIcon');

    	badArticleTitle.innerHTML = data.badArticle.title;
    	badArticlePub.innerHTML = data.badArticle.publicationName;
    	
    	const articleReasons = data.badArticle.credibility.reasons;
    	console.log(articleReasons);
    	if (articleReasons && articleReasons.length > 0) {
    		const reasons = document.getElementById('reasons');
    		for (let i = 0; i < articleReasons.length; i++) {
    			let reasonItem = document.createElement("li");
    			reasonItem.innerHTML = articleReasons[0];
    			reasons.append(reasonItem);
    			document.getElementById('reasonsBlock').style.display = "block";
    		}		
    	}
    	
    	goodArticleLink.innerHTML = data.goodArticle.title;
    	goodArticleLink.setAttribute('href', data.goodArticle.origin);
    	goodArticleImage.src = data.goodArticle.headlineImage;
    	goodArticlePreview.innerHTML = data.goodArticle.articlePreview;

    	fromLineIcon.src = "http://logo.clearbit.com/"+data.goodArticle.publication+"?size=80";
    	fromLineText.innerHTML = data.goodArticle.publicationName;

    	data.rendered = true;
    	sendResponse({received: true});
    }
});
