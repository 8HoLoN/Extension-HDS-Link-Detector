;(function(){
	"use strict";
	//*
	const w = chrome.extension.getBackgroundPage();
	const HDS = w.HDS;

    HDS.browserAction(window,function(){

	});
	//*/

	$.fn.getHiddenOffsetWidth = function () {
		// save a reference to a cloned element that can be measured
		var $hiddenElement = $(this).clone().appendTo('body');

		// calculate the width of the clone
		var width = $hiddenElement.outerWidth();

		// remove the clone from the DOM
		$hiddenElement.remove();

		return width;
	};

	$(document).ready(function(){
		// activate tooltips for all unless disabled element
		$('[data-toggle="tooltip"]:not(:disabled)').tooltip();

		// tooltip for disabled elements
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			var target = $(e.target).attr("href") // activated tab
			$('input:disabled, button:disabled').map(function (_k,_v) {
				$(_v).next().width($(_v).outerWidth());
			});
		});
		$('input:disabled, button:disabled').after(function (e) {
			var d = $("<div>");
			var i = $(this);

			d.css({
				height: i.outerHeight(),
				width: i.outerWidth(),
				position: "absolute",
				top: 0
			});

			//d.css(i.offset());
			d.attr("title", i.attr("title"));
			d.attr("data-placement", i.attr("data-placement"));
			d.tooltip();
			return d;
		});

		// show switch
		$("#wso-activateExtension").bootstrapSwitch({
			onSwitchChange : function(event, state) {
                HDS.switchExtensionActivation(state);
			}
		});


		// show modal
		$('#wso-modal').on('show.bs.modal', function (e) {
			console.log("show");

		});
		// hide modal
		$('#wso-modal').on('hidden.bs.modal', function (e) {
			console.log("hide");
		});

	});

})();