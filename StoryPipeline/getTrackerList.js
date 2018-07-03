const request = require('request');
const fs = require('fs');
const filename = 'trackers.txt';
request.get('https://services.disconnect.me/disconnect-plaintext.json', function (err, response, body) {
  if (err) {
    return console.log(err);
  }
  const services = JSON.parse(body)["categories"];
  let thirdPartyDomains = [];
  Object.keys(services).forEach((category) => {
  	thirdPartyDomains = thirdPartyDomains.concat(services[category]);
  });
  thirdPartyDomains = thirdPartyDomains.map((service) => {
  	const serviceObject = service[Object.keys(service)[0]];
  	return serviceObject[Object.keys(serviceObject)[0]][0];
  });
  fs.writeFile(filename, thirdPartyDomains, (err) => {
  	if (err) throw err;
  	console.log(`Trackers have been saved into ${filename}`);
  });
});