$(document).ready(function() {
	$(".how-this-works-link").click(function() {
	    $([document.documentElement, document.body]).animate({
	        scrollTop: $("#how-this-works").offset().top
	    }, 750);
	});	
});
