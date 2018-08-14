$(document).ready(function() {
	if ("ga" in window) {
	    tracker = ga.getAll()[0];
	} else {
		tracker = {
			send: function(event, evenCat, eventAct, eventLab) {
				ga('send', event, evenCat, eventAct, eventLab);
			}
		}
	}
	$(".how-this-works-link").click(function() {
		tracker.send('event', 'How This Works', 'Click');
	    $([document.documentElement, document.body]).animate({
	        scrollTop: $("#how-this-works").offset().top
	    }, 750);
	});	

	$('.ranking-row').click(function() {
		const publication = $(this).find('.publication').text();
		const articleRow = $(this).next();
		tracker.send('event', 'Rankings', 'Click', publication);
		articleRow.find("div").slideToggle();
	})
});
