var fortune = [
	"Conquer your fears or they will conquer you.",
	"Do not fear what you don't know.",
	"Whenever possible, keep it simple.",
];

exports.getFortune = function() {
	var idx = Math.floor(Math.random() * fortune.length);
	return fortune[idx];
};
