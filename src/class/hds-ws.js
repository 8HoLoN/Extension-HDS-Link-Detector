/**
 * @license
 * Copyright (c) 2016 Alexandre REMY
 *
 * https://github.com/8HoLoN/Extension-We-Share-Op
 * @version: 0.0.7 ( June 2016 )
 * @author 8HoLoN / https://github.com/8HoLoN/
 * < 8holon [at] gmail.com >
 */
(function(HDS){
    "use strict";

    /**
     * Perform an ajax call.
     *
     * @param {string} _url The desired url to reach.
     * @returns {Promise.<XMLHttpRequest>} The promise handling the XMLHttpRequest
     */
    HDS.prototype.asyncSend = function(_url, options) {
        var _promise = new Promise( function (_resolve, _reject) {
            var _xhr = new XMLHttpRequest();
            _xhr.open("GET", _url, true);
            _xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if( this.status >= 200 && this.status < 300 ){
                        _resolve(this);
                    }else{
                        _reject(this);
                    }
                }
            };
            _xhr.send();
        });
        return _promise;
    };

    HDS.prototype.getNumberOfUsers = function(){
        return this.asyncSend('https://chrome.google.com/webstore/detail/eokdbmimjpcdehjmlcfkhcldagjpkflb')
            .then(_xhr=>{
                //var _numberOfUsers = _xhr.responseText.match(/UserDownloads:([0-9]*)/)[1];
                var _numberOfUsers = _xhr.responseText.match(/UserDownloads:(.*?)"/)[1];
                //console.log(_numberOfUsers);
                return _numberOfUsers;
            })
            .catch((_e)=>{
                console.log('error : numberOfUsers',_e);
                return null;
            });
    };

})(HDS);

