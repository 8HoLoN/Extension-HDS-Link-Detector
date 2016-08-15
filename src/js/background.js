;(function(_g){
    'use strict';

    function HDS(){
        this.isEnabled = false;
        this.hdsStateNotificationId = null;
        this.hdsDisabled = 'images/hds_disabled_128.png';
        this.hdsEnabled = 'images/hds_enabled_128.png';
        this.manifestUrl = false;
        this.notifications = [];

        this.init();
        this.initNetworkEvent();
    }

    HDS.prototype.initNetworkEvent = function(){
        chrome.webRequest.onBeforeSendHeaders.addListener( _details =>{
            if( this.isEnabled && this.manifestUrl ){
                console.log('send',_details.url);
                var _fullUrl = _details.url;

                // Double slash in beginning of relative url causes resolve function to
                // return wrong absolute url
                if( _fullUrl.substr(0, 2) == "//") _fullUrl = _fullUrl.substr(1);

                var _url = _fullUrl;
                if( _url.indexOf("?") != -1 ) _url = _url.substr(0, _url.indexOf("?"));
                if( _url.search(/seg\d+\-frag\d+$/i) != -1 ){
                    console.log('request found',_details);

                    var _command = "php AdobeHDS.php --manifest \"" + this.manifestUrl + "\" --delete";
                    //var command = "node AdobeHDS.js --manifest \"" + this.manifestUrl + "\" --delete";
                    var _authParams = false;

                    if( _fullUrl.indexOf("?") != -1 ) _authParams = _fullUrl.substr(_fullUrl.indexOf("?") + 1);
                    if( _authParams ){
                        //var _userAgent = _details.requestHeaders.filter(function(_v){return _v.name=='User-Agent';}).pop().value;
                        var _userAgent = _details.requestHeaders.reduce((_pv,_cv)=>{return _cv.name=='User-Agent'?_cv.value:_pv;},'');
                        //console.log("auth",_userAgent);
                        _command += " --auth \"" + _authParams + "\" --useragent \"" + _userAgent + "\"";
                    }
                    //console.log(command);

                    var _trimmedCmd = _command;
                    var _maxSizeCmd = 75;
                    if( _trimmedCmd.length > _maxSizeCmd) _trimmedCmd = _trimmedCmd.substr(0, _maxSizeCmd-3) + "...";
                    var _title = 'HDS Link Detector';
                    var _subtitle = 'Click to copy command to clipboard';
                    // https://developer.chrome.com/apps/notifications
                    // chrome.notifications.create(string notificationId, NotificationOptions options, function callback);

                    this.notifications.push({
                        'title':_subtitle,//_title,
                        'message':_trimmedCmd,
                        'command':_command,
                        'notificationId':null
                    });

                    this.showNotifications();

                    this.manifestUrl = false;
                }else if( _url.search(/\.mp4$/i) != -1 ){
                    this.notifications.push({
                        'title':'Click to copy Direct Link',//_title,
                        'message':_url,
                        'command':_url,
                        'notificationId':null
                    });

                    this.showNotifications();
                    this.manifestUrl = false;
                }

            }
        },{urls: ["<all_urls>"]},["blocking", "requestHeaders"]);

        chrome.webRequest.onResponseStarted.addListener( _details => {
            if( this.isEnabled && !this.manifestUrl ){
                //console.log(_details.url);
                var _fullUrl = _details.url;

                // Double slash in beginning of relative url causes resolve function to
                // return wrong absolute url
                if( _fullUrl.substr(0, 2) == "//" ) _fullUrl = _fullUrl.substr(1);

                var _url = _fullUrl;
                if( _url.indexOf("?") != -1 ) _url = _url.substr(0, _url.indexOf("?"));
                if( _url.search(/\.f4m$/i) != -1 ){
                    console.log("manifestUrl",_details);
                    this.manifestUrl = _fullUrl;
                }
            }
        },{urls: ["<all_urls>"]});
    };

    HDS.prototype.init = function() {
        var that = this;
        chrome.storage.local.get('isEnabled', _items =>{
            this.isEnabled = (typeof _items['isEnabled']!=='undefined'?_items['isEnabled']:false);
            this.updateIcon();
        });

        chrome.browserAction.onClicked.addListener(tab=>{
            this.isEnabled = !this.isEnabled;
            this.manifestUrl = false;
            this.updateIcon();
        });

        chrome.notifications.onClosed.addListener((_notificationId, _byUser)=>{
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
                //that.openTemporaryWindowToRemoveFocus();
                console.log('clear',_wasCleared);
            });


            var _index = that.notifications.indexOf(_notification);
            delete that.notifications[_index];
            that.notifications.splice(_index, 1);
            console.log("bh",_notification);


            Object.keys(that.notifications).map(function(_i){console.log(_i)});
        });

        chrome.webRequest.onBeforeRequest.addListener(function(_details) {
            //console.log(_details);
        }, {urls: ["<all_urls>"]}, ["blocking"]);


    };

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
    };

    // open a window to take focus away from notification and there it will close automatically
    HDS.prototype.openTemporaryWindowToRemoveFocus = function() {
       var win = window.open("about:blank", "emptyWindow", "width=1, height=1, top=50000, left=50000");
       //var win = window.open();
       win.close();
    };

    HDS.prototype.showNotifications = function() {
        this.notifications.map(_v=>{
            if( _v.notificationId == null ){
                _v.notificationId = '';
                this.createNotification({
                    title: _v.title,
                    message: _v.message,
                    iconUrl: this.hdsEnabled,
                    isClickable: true,
                    requireInteraction: true
                }).then( _notificationId => {
                    console.log('notificationId',_notificationId);
                    _v.notificationId=_notificationId;
                    //notifications[_notificationId]={'command':command};
                    console.log('after',this.notifications);
                });
            }
        });
    };

    HDS.prototype.createNotification = function(_args){
        return new Promise( function (_resolve, _reject) {
            chrome.notifications.create('', {
                'type': 'basic',// basic list
                'title': _args.title,
                'message': _args.message,
                'iconUrl': _args.iconUrl,
                'isClickable':_args.isClickable,
                'requireInteraction':_args.requireInteraction
                //'eventTime' : Date.now() + 30000
                //'items': items.map(function(item) { return { 'title': subtitle, 'message': item['command'] }; })
            }, (_notificationId) => {
                _resolve(_notificationId);//_reject(this);
            });
        });
    };

    HDS.prototype.updateIcon = function() {
        chrome.storage.local.set({ 'isEnabled': this.isEnabled });
        if( this.hdsStateNotificationId )chrome.notifications.clear(this.hdsStateNotificationId);

        var _stateIt = this.isEnabled?1:0;
        var _state = {
            icon:[this.hdsDisabled,this.hdsEnabled],
            title:['Disabled','Enabled'],
            message:['HDS Link Detector is now disabled.','HDS Link Detector is now enabled.'],
        };

        chrome.browserAction.setIcon({path: _state.icon[_stateIt]});
        this.createNotification({
            title: _state.title[_stateIt],
            message: _state.message[_stateIt],
            iconUrl: _state.icon[_stateIt],
            isClickable: false,
            requireInteraction: false
        }).then( _notificationId => {
            this.hdsStateNotificationId = _notificationId;
            console.log('notificationId',_notificationId);
        });
    };

    _g.HDS = new HDS();

})(window);
