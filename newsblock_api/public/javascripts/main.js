$(document).ready(function() {
	$(".how-this-works-link").click(function() {
		ga('send', 'event', 'How This Works', 'Click');
	    $([document.documentElement, document.body]).animate({
	        scrollTop: $("#how-this-works").offset().top
	    }, 750);
	});	

	$('.ranking-row').click(function() {
		const publication = $(this).find('.publication').text();
		const articleRow = $(this).next();
		ga('send', 'event', 'Rankings', 'Click', publication);
		articleRow.find("div").slideToggle();
	})
});
