const data = {}
data.rendered = false;

function getCredGrouping(credScore) {
    let grouping = null;

    if (credScore <= 40) {
        grouping = {
            name: "Very Poor",
            color: "rgba(207,70,71,.7)"
        };
    } else if (credScore <= 60) {
        grouping = {
            name: "Poor",
            color: "rgba(207,103,0,.7)"
        };
    } else if (credScore <= 80) {
        grouping = {
            name: "Average",
            color: "rgba(207,210,0,1)"
        };
    }

    return grouping;
}

let timesRequested = 0;
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    timesRequested++;
	console.log(request);
    if ("badArticle" in request && !data.rendered) {
    	data.badArticle = request.badArticle;
    	data.goodArticle = request.goodArticle;
    	const badArticleTitle = document.getElementById('badArticleTitle');
    	const badArticlePub = document.getElementById('badArticlePub');
        const badArticleCredGroup = document.getElementById('badArticleCredGroup');
        const goodArticleBlock = document.getElementById('goodArticleBlock');
        const goodArticleLinks = document.getElementsByClassName('goodArticleLink');
    	const goodArticleImage = document.getElementById('goodArticleImage');
    	const goodArticlePreview = document.getElementById('goodArticlePreview');
    	const fromLineText = document.getElementById('fromLineText');
        const fromLineIcon = document.getElementById('fromLineIcon');
        const clickedOnIcon = document.getElementById('clickedOnIcon');

    	badArticleTitle.innerHTML = "\""+data.badArticle.title+"\"";
        if (data.badArticle.origin.indexOf('?') > -1) {
            data.badArticle.origin = data.badArticle.origin+"&nb_force=true"
        } else {
            data.badArticle.origin = data.badArticle.origin+"?nb_force=true"
        }
        badArticleTitle.setAttribute('href', data.badArticle.origin);
    	badArticlePub.innerHTML = data.badArticle.publicationName;
        const credGrouping = getCredGrouping(data.badArticle.credibility.score);
    	badArticleCredGroup.innerHTML = credGrouping.name;
        badArticleCredGroup.style.color = credGrouping.color;
    	const articleReasons = data.badArticle.credibility.reasons;
    	if (articleReasons && articleReasons.length > 0) {
    		const reasons = document.getElementById('reasons');
    		for (let i = 0; i < articleReasons.length; i++) {
    			let reasonItem = document.createElement("li");
    			reasonItem.innerHTML = (i == 0) ? "<b>" + articleReasons[i] + "</b>" : articleReasons[i];
    			reasons.append(reasonItem);
    			document.getElementById('reasonsBlock').style.display = "block";
    		}		
    	}
    	
        if (data.goodArticle.origin.indexOf("?") > -1) {
            data.goodArticle.origin += "&nb_force=true";
        } else {
            data.goodArticle.origin += "?nb_force=true";
        }

        for (let i = 0; i < goodArticleLinks.length; i++) {  
            if (goodArticleLinks[i].classList.contains('include-title')) {
                goodArticleLinks[i].innerHTML = data.goodArticle.title;
            }         
            goodArticleLinks[i].setAttribute('href', data.goodArticle.origin);
        }

    	goodArticleImage.style.backgroundImage = "url("+data.goodArticle.headlineImage+")";
        if (data.goodArticle.articlePreview && data.goodArticle.articlePreview.trim().length > 0) {
            goodArticlePreview.innerHTML = "\""+data.goodArticle.articlePreview.substring(0,100) + "...\"";
        } else {
            goodArticlePreview.style.display = "none";
        }

    	if (data.goodArticle.publicationName.indexOf("ABC") > -1) {
            fromLineIcon.style.display = "none";
        } else {
            fromLineIcon.src = "http://logo.clearbit.com/"+data.goodArticle.publication+"?size=80";
        }

        fromLineText.innerHTML = data.goodArticle.publicationName;

        if (data.badArticle.publicationName.indexOf("ABC") > -1) {
            clickedOnIcon.style.display = "none";
        } else {
            clickedOnIcon.src = "http://logo.clearbit.com/"+data.badArticle.publication+"?size=60";
        }

    	data.rendered = true;
        const storageKey = "newsblock_auto";
        document.querySelectorAll('.settingsOption .slider')[0]
            .addEventListener('click', function (e) {
            const option = document.querySelectorAll('.settingsOption')[0];
            if (option.classList.contains("on")) {
                chrome.storage.sync.remove(storageKey);
            } else {
                const sliderSet = {};
                sliderSet[storageKey] = "on";
                chrome.storage.sync.set(sliderSet);
            }
            option.classList.add("on");
        });
    	sendResponse({received: true});
    } else if (timesRequested > 20) {
        sendResponse({received: true});
    }
});
