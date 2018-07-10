$(document).ready(function() {
	chrome.storage.sync.get(null, function(items) {
		console.log(items);
		const sliders = ['auto', 'banner', 'disable'];
		sliders.forEach((sliderName) => {
			const storageKey = "newsgate_"+sliderName;
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
});