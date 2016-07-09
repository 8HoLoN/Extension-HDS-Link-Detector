# Extension HDS Link Detector
Chrome Extension to detect the HDS videos

## Introduction

This Chrome extension is an adaptation of the [Firefox add-on](https://addons.mozilla.org/fr/firefox/addon/hds-link-detector/) made by [K-S-V](https://github.com/K-S-V).

This extension automatically detects the HDS videos being played in browser and generates proper command line required for downloading videos with AdobeHDS.js script.

## About
Adobe HDS (HTTP Dynamic Streaming) is a new technology to deliver video stream in fragments instead of one single stream. AdobeHDS.js script was created to download and stitch those fragments in single flv file. you need to pass some parameters (e.g. manifest) to the script to download videos. Though finding those parameters is easy but doing so for multiple videos can easily become cumbersome job. This extension was created to facilitate the automatic detection of those parameters and generate proper command line which you can simply paste in the console to download your video.

## Basic use

Click the extension icon in the extensions bar to switch between both states.
>
<img src="https://raw.githubusercontent.com/8HoLoN/Extension-HDS-Link-Detector/master/src/images/hds_enabled.png" width="24"> : active
>
<img src="https://raw.githubusercontent.com/8HoLoN/Extension-HDS-Link-Detector/master/src/images/hds_disabled.png" width="24"> : inactive

* Active the extension via the icon
* Visit a website which embed an HDS video
* Within few seconds, a popup show up
* Click the popup
* The command line is now copied into your clipboard.
