const articleRows = document.querySelectorAll('.articleRow');
for (let i = 0; i < articleRows.length; i++) {
    articleRows[i].addEventListener('click', function(e) {
        if (e.target.tagName == "A") {
        	return
        }
        const title = $(articleRows[i]).find('a').text()
        const publication = $(articleRows[i]).find('label').text()
        $('#chosenArticleTitle').text(title);
        $('#chosenArticlePub').text(' - ' + publication);
    });
}

$(function() {
	var handle = $( "#custom-handle" );
	$( "#slider" ).slider({
		range: "min",
		value: 50,
		min: 1,
		max: 100,
		create: function() {
			$('.ui-slider-range-min').css('backgroundColor', 
				redGreenScale($(this).slider("value"))
			);
			const handleText = $('.slider-handle-text');
			handleText.css('left', $(this).slider("value")+"%");
			handleText.text($(this).slider("value")+"%");

			// handle.text("");

		},
		slide: function( event, ui ) {
			$('.ui-slider-range-min').css('backgroundColor', 
				redGreenScale(ui.value)
			);
			const handleText = $('.slider-handle-text');
			handleText.css('left', ui.value+"%");
			handleText.text(ui.value+"%");

			// handle.text("");
		}
	});
});

$(document).ready(function() {
  $('#reviewBox').summernote({
  	toolbar: [
		// [groupName, [list of button]]
		['style', ['bold', 'italic', 'underline', 'clear']],
		['font', ['strikethrough', 'superscript', 'subscript']],
		['fontsize', ['fontsize']],
		['color', ['color']],
		['para', ['ul', 'ol', 'paragraph']],
		['link', ['link']]
	]
  });
});