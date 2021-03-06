define(['knockout', 'text!./result-list.html', 'knockout-postbox'], function(ko, template) {
	function ListViewModel() {
		var self = this;
		self.search_terms = ko.observable('nada').subscribeTo('search_terms');
		self.tracks = ko.observableArray([initial_result]	).subscribeTo('new_results');
		self.list_size = ko.computed(function() {
			return ' ' + 	self.tracks().length;
		});
		self.hasSamples = ko.observable(false); // filter flag
		self.hasLyrics = ko.observable(false); // filter flag
		self.latest_fave = ko.observable({}).publishOn('fave_alert', function () { return false; }); // second param forces update even if same value...otherwise btn click gets suppressed
		// determines list to be displayed based on filter flags
		self.display_list = ko.computed(function() {
			if (!self.hasSamples() && !self.hasLyrics()) {
				return self.tracks();
			} else if (self.hasSamples() && !self.hasLyrics()) {
				return ko.utils.arrayFilter(self.tracks(), function(item) {
					return item.url !== 'No Url';
				});
			} else if (!self.hasSamples() && self.hasLyrics()) {
				return ko.utils.arrayFilter(self.tracks(), function(item) {
					return item.lyrics_url !== '#';
				});
			} else {
				return ko.utils.arrayFilter(self.tracks(), function(item) {
					return item.lyrics_url !== '#' && item.url !== 'No Url';
				});
			}
		});

		var list_location = {k:37.399864, D:-122.10840000000002}; // default location
		// timing is key: this alert occurs when a search has been made. We want the location at THAT time
		ko.postbox.subscribe('new_results', function() {
			list_location = app.current_location;
		});

		// user selects a track to see additional options
		// Note: called from view using bind(), this = data_obj
		// NOTE2: not specifying event as param breaks in
		// Firefox; Chrome/Safari ok
		self.selectResult = function(event) {			
			// if the target wasnt a btn, toggle the class
			// if other item had the class, remove it
			if(event.target.nodeName !== "BUTTON" ) {
				if(!$(this).hasClass('result-selected')) {
					var prev_selected = $('.result-selected');
					prev_selected.toggleClass('result-selected');
					prev_selected.find('.result-btn-panel').slideToggle();
				}
				$(this).toggleClass('result-selected');
				$(this).find('.result-btn-panel').slideToggle();
			}

			var track = ko.dataFor(event.target);
			// config the info window
			app.configInfopane(track);
		};

		// allows user to mark a track as "favorite", thereby
		// alerting faves array list
		self.setFave = function(index) {
			// timing is key; I want the location at time of search
			// I can then append to Result obj to be incorporated into Fave
			var new_fave = self.tracks()[index];
			new_fave.location = list_location;
			self.latest_fave(new_fave);
		};

		// open info window
		self.checkIt = function(track, event) {
			event.stopPropagation()

			app.configInfopane(track);
			app.hideList();
			setTimeout(function() {
				app.infopaneOpen(list_location);				
			}, 800);
		};

		// delegate click handling to the parent list
		$('#result-list').on('click', 'li', self.selectResult);
	}
	// end Ist Model definition
	return { viewModel: ListViewModel, template: template };
});
