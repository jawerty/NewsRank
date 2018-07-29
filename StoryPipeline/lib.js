const fs = require('fs');
const request = require('request');

const readFileToArray = (fileLocation, callback) => {
  fs.readFile(fileLocation, function(err, data) { // only read once
    if(err) {
      throw err;
      process.exit(1);
    }

    const sources = data.toString().split("\n");
    callback(sources);
  });
}

const getWebpage = (source, callback) => {
  readFileToArray('user-agents.txt', (userAgents) => {
    randUserAgent = userAgents[Math.floor(Math.random()*userAgents.length)];
    const requestObj = {
      url: source,
      method: 'GET',
      timeout: 300000,
      jar: true // remember cookies in redirects (made for washington post)
    };

    if (source.includes("thehill")) { // and to any site returning binary zip data (thehill)
		  requestObj["gzip"] = true;
	  }

    if (!source.includes("infowars")
      && !source.includes("thefederalist")
      && !source.includes("thedailybeast")
      && !source.includes("bipartisanreport")
      && !source.includes("prisonplanet")
      && !source.includes("redstate")) {
      requestObj["headers"] = {
        'User-Agent': randUserAgent // daily beast was the first to make this necessary
      }
    }
    if (source == "javascript:void(0);") return callback();
    try {
		request(requestObj, (error, response, body) => {
			
	      if (error) {
	        callback(error, null);
	      } else if (response.statusCode != 200 && response.statusCode != 302) {
          console.log(response.body); 
	        console.log(source, response.statusCode)
	        callback("Response wasn't successful for "+ source, null);
	      } else {
	        callback(null, body);
	      }
	    });
	} catch (e) {
		console.log(e)
		callback("REQUEST FAILED for "+source, null);
	}
  });
}
module.exports = {
    readFileToArray,
    getWebpage
}