let check = (function () {
	let callbacks = [],
		timeLimit = 50,
		open = false;
	setInterval(loop, 1);
	return {
		addListener: function (fn) {
			callbacks.push(fn);
		},
		cancleListenr: function (fn) {
			callbacks = callbacks.filter(function (v) {
				return v !== fn;
			});
		}
	};

	function loop() {
		let startTime = new Date();
		debugger;
		if (new Date() - startTime > timeLimit) {
			if (!open) {
				callbacks.forEach(function (fn) {
					fn.call(null);
				});
			}
			open = true;
			window.stop();
			alert("做咩?");
		} else {
			open = false;
		}
	}
})();

check.addListener(function () {
	window.location.reload();
});
