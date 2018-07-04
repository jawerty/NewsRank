$(document).ready(function() {
	chrome.storage.sync.get('newsgate_auto', function(data) {
		console.log(data)
		let auto = data.newsgate_auto || null;
		if (auto == "on") {
			$('.settingsOption[data-name=auto] input').click()
		}
		$('.slider').off().on('click', function (e) {
			e.stopPropagation();
			const option = $(this).closest('.settingsOption');
			if (auto == "on") {
				chrome.storage.sync.remove('newsgate_auto');
			} else {
				chrome.storage.sync.set({"newsgate_auto": "on"});
			}
			console.log($(this));
			option.toggleClass("on");
		});
	});
});