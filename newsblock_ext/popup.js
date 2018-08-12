let service = analytics.getService('Newsblock');

let tracker = service.getTracker('UA-38539483-3');
tracker.sendAppView('MainView');

let INFO_CLICKED = analytics.EventBuilder.builder()
    .category('INFO')
    .action('Clicked');

let SETTINGS_CLICKED = analytics.EventBuilder.builder()
    .category('SETTINGS')
    .action('Clicked');

$(document).ready(function() {
	chrome.storage.sync.get(null, function(items) {
		let doOnboarding = true;
		if ('end_onboarding' in items) {
			doOnboarding = false;
		} else {
			if ('onboarding_iterator' in items) {
				items['onboarding_iterator'] = parseInt(items['onboarding_iterator']) + 1;
				let setOnboarding = {
					onboarding_iterator: items['onboarding_iterator']
				};
				if (items['onboarding_iterator'] >= 5) {	
					setOnboarding['end_onboarding']	= true;			
				}
				chrome.storage.sync.set(setOnboarding);
			} else {
				chrome.storage.sync.set({
					onboarding_iterator: 1
				});
			}	
		}

		if (doOnboarding) {
			$('.settingsHint').after("<p>Oboarding</p>");
		}
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
				tracker.send(SETTINGS_CLICKED.label(sliderName));
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
		tracker.send(INFO_CLICKED.label('info-header'));
	});
});