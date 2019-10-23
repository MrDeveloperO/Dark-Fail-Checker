document.addEventListener("DOMContentLoaded", init);

// getActiveTab returns focused tab
function getActiveTab(callback) {
    browser.tabs.query({currentWindow: true}).then(function(tabs){
        tabs.forEach(function(tab){
            if(tab.active) {
                callback(tab);
                return;
            }
        });
    });
}

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

// the main function which is called
function init() {
    getActiveTab(function(tab){
        var tabURL = new URL(tab.url);
        var origin = tabURL.origin;
        getURLs().then(function(allUrls) {
            var ok = allUrls.includes(origin);
            
            var elem = document.createElement("P");
            var t = null;

            if(ok) {
                // valid url
                t = document.createTextNode(origin+" is a valid onion url");
                elem.setAttribute("style", "color: green;");
            }else {
                // url not found on dark.fail, show the caution
                t = document.createTextNode(origin+" cannot be found on dark.fail. Proceed with caution!");
                elem.setAttribute("style", "color: red;");
            }
            elem.appendChild(t);
            document.getElementById("loading").style.display = "none";
            document.getElementById("results").style.display = "block";
            document.getElementById("results").appendChild(elem);
        
        });
    });
}