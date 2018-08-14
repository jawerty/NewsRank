$(document).ready(function() {
	$(".how-this-works-link").click(function() {
	    $([document.documentElement, document.body]).animate({
	        scrollTop: $("#how-this-works").offset().top
	    }, 750);
	});	

	$('.ranking-row').click(function() {
		const articleRow = $(this).next();
		articleRow.find("div").slideToggle();
	})
});
