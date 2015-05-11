;(function(_g){
    'use strict';

    function HDS(){
        var that = this;
        this.isEnabled=false;
        this.hdsDisabled = 'images/hds_disabled.png';
        this.hdsEnabled = 'images/hds_enabled.png';
        this.manifestUrl = false;
        this.notifications = [];

        chrome.storage.local.get('isEnabled', function(items) {
            that.isEnabled = (typeof items['isEnabled']!=='undefined'?items['isEnabled']:false);
            that.updateIcon();
        });

        chrome.browserAction.onClicked.addListener(function(tab) {
            that.isEnabled=!that.isEnabled;
            that.updateIcon();
        });

        chrome.notifications.onClosed.addListener(function(_notificationId){
            console.log('close ',_notificationId);
        });

        chrome.notifications.onClicked.addListener(function(_notificationId){
            //chrome.notifications.onClicked.removeListener(_notificationId);
            console.log('notificationId click',_notificationId);

            var _notification = that.notifications.filter(function(_v){return _v.notificationId==_notificationId;})[0];
            console.log("filter",_notification);

            console.log("plop",that.notifications,that.notifications[_notificationId]);
            that.copyToClipboard({"text":_notification.command});

            chrome.notifications.clear(_notificationId, function(_wasCleared){
                that.openTemporaryWindowToRemoveFocus();
                console.log('clear',_wasCleared);
            });


            var _index = that.notifications.indexOf(_notification);
            delete that.notifications[_index];
            that.notifications.splice(_index, 1);
            console.log("bh",_notification)


            Object.keys(that.notifications).map(function(_i){console.log(_i)});
        });

        chrome.webRequest.onBeforeRequest.addListener(function(_details) {
            //console.log(_details);
        }, {urls: ["<all_urls>"]}, ["blocking"]);

        chrome.webRequest.onBeforeSendHeaders.addListener(function(_details) {

            if ( that.manifestUrl ){
                //console.log(_details.url);
                var fullUrl = _details.url;

                // Double slash in beginning of relative url causes resolve function to
                // return wrong absolute url
                if (fullUrl.substr(0, 2) == "//") fullUrl = fullUrl.substr(1);

                var url = fullUrl;
                if (url.indexOf("?") != -1) url = url.substr(0, url.indexOf("?"));
                if (url.search(/seg\d+\-frag\d+$/i) != -1){
                    console.log('request found',_details);

                    var command = "node AdobeHDS.js --manifest \"" + that.manifestUrl + "\" --delete";
                    var authParams = false;

                    if (fullUrl.indexOf("?") != -1) authParams = fullUrl.substr(fullUrl.indexOf("?") + 1);
                    if (authParams){
                        //var userAgent = _details.requestHeaders.filter(function(_v){return _v.name=='User-Agent';}).pop().value;
                        var userAgent = _details.requestHeaders.reduce(function(_pv,_cv){return _cv.name=='User-Agent'?_cv.value:_pv;},'');
                        //console.log("auth",userAgent);
                        command += " --auth \"" + authParams + "\" --useragent \"" + userAgent + "\"";
                    }
                    //console.log(command);

                    var trimmedCmd = command;
                    if (trimmedCmd.length > 256) trimmedCmd = trimmedCmd.substr(0, 253) + "...";
                    var items = [];
                    items.push({'command':command});
                    var title = 'HDS Link Detector';
                    var subtitle = 'Click to copy command to clipboard';
                    // https://developer.chrome.com/apps/notifications
                    // chrome.notifications.create(string notificationId, NotificationOptions options, function callback);

                    that.notifications.push({
                        'title':title,
                        'message':trimmedCmd,
                        'command':command,
                        'notificationId':null
                    });

                    that.showNotifications();

                    that.manifestUrl = false;
                }

            }
        },{urls: ["<all_urls>"]},["blocking", "requestHeaders"]);


        chrome.webRequest.onResponseStarted.addListener(function(_details) {
            //console.log(_details);
            var fullUrl = _details.url;

            // Double slash in beginning of relative url causes resolve function to
            // return wrong absolute url
            if (fullUrl.substr(0, 2) == "//") fullUrl = fullUrl.substr(1);

            var url = fullUrl;
            if (url.indexOf("?") != -1) url = url.substr(0, url.indexOf("?"));
            if (url.search(/\.f4m$/i) != -1){
                console.log("manifestUrl",_details);
                that.manifestUrl = fullUrl;
            }

        },{urls: ["<all_urls>"]});

    }


    HDS.prototype.copyToClipboard = function(message) {
        var input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = message.text;
        input.focus();
        input.select();
        //document.execCommand('Copy');
        //document.execCommand('Copy',true);
        document.execCommand('copy', false, null);
        input.remove();
    }

    // open a window to take focus away from notification and there it will close automatically
    HDS.prototype.openTemporaryWindowToRemoveFocus = function() {
       var win = window.open("about:blank", "emptyWindow", "width=1, height=1, top=50000, left=50000");
       //var win = window.open();
       win.close();
    }

    HDS.prototype.showNotifications = function() {
        var that = this;
        this.notifications.map(function(_v){

            if( _v.notificationId==null ){
                _v.notificationId='';
                chrome.notifications.create('', {
                    'type': 'basic',// basic list
                    'title': _v.title,
                    'message': _v.message,
                    'iconUrl': that.hdsEnabled,
                    'isClickable':true,
                    //'eventTime' : Date.now() + 30000
                    //'items': items.map(function(item) { return { 'title': subtitle, 'message': item['command'] }; })
                }, function(_notificationId) {
                    console.log('notificationId',_notificationId);
                    _v.notificationId=_notificationId;
                    //notifications[_notificationId]={'command':command};
                    console.log('after',that.notifications);
                });
            }

        });

    }

    HDS.prototype.updateIcon = function() {
        chrome.storage.local.set({ 'isEnabled': this.isEnabled });
        if( this.isEnabled ){
            chrome.browserAction.setIcon({path: this.hdsEnabled});
        }else{
            chrome.browserAction.setIcon({path: this.hdsDisabled});
        }
    };


    _g.HDS = new HDS();

})(window);
