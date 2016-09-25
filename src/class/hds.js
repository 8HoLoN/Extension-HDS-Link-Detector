;(function(_g){
    'use strict';

    function HDS(){
        this.version = chrome.runtime.getManifest().version;
        this.isEnabled = false;
        this.hdsStateNotificationId = null;
        this.hdsDisabled = 'icons/hds_disabled_128.png';
        this.hdsEnabled = 'icons/hds_enabled_128.png';
        this.manifestUrl = false;
        this.watchDog = null;
        this.notifications = [];

        this.userData = {
            hds : {
                phpPath: '',
                qualityLevel: ''
            },
            options : {
                outputManifestUrlOnly: false
            }
        };

        this.init();
        this.initNetworkEvent();
        this.initA47Listener();
    }

    HDS.prototype.initA47Listener = function () {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                /*
                console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                    "from the extension");
                //*/
                if( request.a47 ){
                    //console.log(request.vjp);
                    var vjp = request.vjp;
                    if( vjp.VSO === 'live' ){
                        var _live = Object.keys(vjp.VSR).map((_v)=>{
                            return vjp.VSR[_v];
                        });
                        console.log(_live);
                    }
                    sendResponse({farewell: "goodbye"});
                }
            });
    };

    HDS.prototype.initNetworkEvent = function(){

        chrome.webRequest.onBeforeSendHeaders.addListener( _details =>{
            if( this.isEnabled && this.manifestUrl ){
                if( !this.watchDog ){
                    this.watchDog = setTimeout(()=>{this.manifestUrl=false},20*1000);
                }

                //TODO after 30s set manifestUrl to false if any link found
                console.log('send',_details.url);
                var _fullUrl = _details.url;

                // Double slash in beginning of relative url causes resolve function to
                // return wrong absolute url
                if( _fullUrl.substr(0, 2) == "//") _fullUrl = _fullUrl.substr(1);

                var _url = _fullUrl;
                if( _url.indexOf("?") != -1 ) _url = _url.substr(0, _url.indexOf("?"));
                if( _url.search(/seg\d+\-frag\d+$/i) != -1 ){
                    clearTimeout(this.watchDog);
                    this.watchDog = null;
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
                    if( this.userData.hds.phpPath ){
                        _command = this.userData.hds.phpPath + _command;
                    }
                    if( this.userData.hds.qualityLevel ){
                        _command += " --quality " + this.userData.hds.qualityLevel;
                    }
                    if( this.userData.options.outputManifestUrlOnly ){
                        _command = this.manifestUrl;
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

        chrome.storage.local.set({hldVersion:this.version},()=>{
            console.log(chrome.runtime.lastError);
            //chrome.runtime.id

            chrome.storage.local.get(['hldUserData','hldVersion'],(_items)=>{
                try{
                    this.loadData(_items);
                }catch (e){
                    console.log(e);
                }
                //this.saveData();
                //this.computeData();
                //this.updateFinanceData();
            });
        });

        /*
         chrome.browserAction.onClicked.addListener(tab=>{
         this.isEnabled = !this.isEnabled;
         this.manifestUrl = false;
         this.updateIcon();
         });
         //*/

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

    /**
     * Load user data from chrome local storage.
     * @param {string} str - The string containing two comma-separated numbers.
     * @return {undefined}
     */
    HDS.prototype.loadData = function(_items){
        console.log(_items);
        console.log(sjcl.decrypt("hld"+chrome.runtime.id,_items.hldUserData));
        var _userData = JSON.parse(sjcl.decrypt("hld"+chrome.runtime.id,_items.hldUserData));
        this.userData.hds.phpPath = _userData.hds.phpPath;
        this.userData.hds.qualityLevel = _userData.hds.qualityLevel;
        this.userData.options.outputManifestUrlOnly = _userData.options.outputManifestUrlOnly;
    };

    /**
     * Save user data to chrome local storage.
     * @return {undefined}
     */
    HDS.prototype.saveData = function(){
        chrome.storage.local.set({hldUserData:sjcl.encrypt("hld"+chrome.runtime.id,JSON.stringify(this.userData),{ks:256})}, function (){
            console.log('saveError',chrome.runtime.lastError);
            //chrome.runtime.id
        });
    };

    HDS.prototype.switchExtensionActivation = function(_state) {
        this.isEnabled = _state;
        this.manifestUrl = false;
        this.updateIcon();
    };

    HDS.prototype.browserAction = function(_window){
        //_window.close();
        var that=this;
        console.log("browserAction");
        this._window = _window;

        _window.addEventListener("unload", function(){
            that._window = null;
        });

        this.displayI18n(_window);
        this.displayData(_window);

        var _gEBI = _window.document.getElementById.bind(_window.document);
        var _gM = chrome.i18n.getMessage;
        _gEBI('wso-phpPath').addEventListener('keyup',function(){
            console.log('test phpPath');
            that.userData.hds.phpPath = this.value;
            that.saveData();
        });
        _gEBI('wso-qualityLevel').addEventListener('change',function(){
            console.log('test qualityLevel');
            that.userData.hds.qualityLevel = this.value;
            that.saveData();
        });
        _gEBI('wso-qualityLevel').addEventListener('keyup',function(){
            console.log('test qualityLevel');
            that.userData.hds.qualityLevel = this.value;
            that.saveData();
        });

        _gEBI('wso-activateExtension').addEventListener('change',function(){
            that.switchExtensionActivation(this.checked);
        });
        _gEBI('wso-outputUrlOnly').addEventListener('change',function(){
            that.userData.options.outputManifestUrlOnly = this.checked;
            that.saveData();
        });

        this.getNumberOfUsers()
            .then(_numberOfUsers=>{
                if(_numberOfUsers!==null){
                    _gEBI('wso-numberOfUsers').innerHTML = _gM('numberOfUsers',_numberOfUsers);
                }
            });

    };

    _g.HDS = HDS;

})(window);
