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

    HDS.prototype.displayI18n = function(_window){
        var _gEBI = _window.document.getElementById.bind(_window.document);
        var _qSA = _window.document.querySelectorAll.bind(_window.document);
        var _gM = chrome.i18n.getMessage;

        var _i18n = ['innerHTML','title','placeholder'];
        _i18n = _i18n.map((_v,_k)=>
            [].concat(_v,_k?['-'+_v,_v[0].toUpperCase()+_v.slice(1)]:['',''])
        );

        _i18n.map((_v,_k)=>{
            Array.from(_qSA('[data-i18n'+_v[1]+']')).map(_el =>{
                _el[_v[0]] = _gM(_el.getAttribute('data-i18n'+_v[1]));
                delete _el.dataset['i18n'+_v[2]];
            });
        });

        //_gEBI("wso-feedback").href = "mailto:"+"8holon"+"@"+"gmail.com?Subject=Feedback";
        //_gEBI("wso-feedback").innerHTML = "8holon"+"&#64;"+"gmail.com";
        _gEBI("wso-feedback").href = "https://github.com/8HoLoN/Extension-HDS-Link-Detector/issues";
        _gEBI("wso-feedback").innerHTML = "Extension-HDS-Link-Detector/issues";

        _gEBI("wso-version").innerHTML = this.version;
    };

    HDS.prototype.displayData = function(_window){
        var _gEBI = _window.document.getElementById.bind(_window.document);
        _gEBI('wso-activateExtension').checked = this.isEnabled;
        _gEBI('wso-phpPath').value = this.userData.hds.phpPath;
        _gEBI('wso-qualityLevel').value = this.userData.hds.qualityLevel;
    };

})(HDS);

