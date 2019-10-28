(function() {

console.log("Runnning...");
var extensionURL = browser.runtime.getURL("alert.html");

// extractLinks calls the dark.fail and extract all urls
function extractLinks(callback) {
    var url = "https://dark.fail";
    fetch(new Request(url)).then(function(response){
        return response.text();
    }).then(function(body){
        var parser = new DOMParser();
        var doc = parser.parseFromString(body, "text/html");
        var elements = doc.querySelectorAll("li > code");
        var urls = [];
        elements.forEach(function(node){
            urls.push(node.innerHTML);
        });
        callback(urls);
    }).catch(function(err){
        callback(null, err);
    });
}

// getURLs retrives all valid URLs (from local storage or calling dark.fail)
// @TODO handle errors
function getURLs() {
    var defer = new Promise(function(resolve, reject){
        browser.storage.local.get().then(function(res){
            if(res.darkfail) {
                console.log("getting urls from local storage");
                resolve(res.darkfail);
                return;
            }
            extractLinks(function(resp, err) {
                browser.storage.local.set({
                    darkfail: resp
                });
                resolve(resp);
            });
        });
    });

    return defer;
}

getURLs().then(function(allUrls) {
    var ok = allUrls.includes(window.location.origin);
    if(!ok) {
        window.location.href = extensionURL;
    }

});

})();
