const Assistant = require('./lib');//it would be require('desktop-voice-assistant') in your project

// console.log(Assistant);
Assistant.init(Assistant.procedures, {open_listener: false});