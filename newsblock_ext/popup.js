$(document).ready(function() {
	chrome.storage.sync.get(null, function(items) {
		console.log(items);
		const sliders = ['auto', 'banner', 'disable', 'low'];
		sliders.forEach((sliderName) => {
			const storageKey = "newsblock_"+sliderName;
			if (storageKey in items 
				&& items[storageKey] == "on") {
				$('.settingsOption[data-name='+sliderName+'] input').click()
			}
			$('.settingsOption[data-name='+sliderName+'] .slider')
				.off()
				.on('click', function (e) {
				e.stopPropagation();
				const option = $(this).closest('.settingsOption');
				if (items[storageKey] == "on") {
					chrome.storage.sync.remove(storageKey);
				} else {
					const sliderSet = {};
					sliderSet[storageKey] = "on";
					chrome.storage.sync.set(sliderSet);
				}
				option.toggleClass("on");
			});
		});
		
	});

	$('.settingsOption').on('mouseover', function() {
		const settingName = $(this).data('name');
		$('.settingsHintText').hide();
		$('.settingsHintText.'+settingName).css("display", "table-cell");
	});

	$('.settingsOption').on('mouseout', function() {
		$('.settingsHintText').hide();
		$('.settingsHintText.default').css("display", "table-cell");
	});

	$('.info-header').on('click', function(e) {
		$(this).toggleClass('clicked');
		$('.info-body').slideToggle(250);
		$('.icon-circle-down').toggleClass('rotate');
	});
});