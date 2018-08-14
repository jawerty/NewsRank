$(document).ready(function() {

	$(".how-this-works-link").click(function() {
		gtag('event', 'Click', {
			'event_category': 'How This Works'
		});

	    $([document.documentElement, document.body]).animate({
	        scrollTop: $("#how-this-works").offset().top
	    }, 750);
	});	

	$('.ranking-row').click(function() {
		const publication = $(this).find('.publication').text();
		const articleRow = $(this).next();
		gtag('event', 'Click', {
			'event_category': 'Rankings',
			'event_label': publication
		});
		articleRow.find("div").slideToggle();
	})
});
