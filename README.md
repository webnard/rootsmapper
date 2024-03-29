# RootsMapper

## [Donate](http://blog.rootsmapper.com/p/donate.html)

## Setup

### Edit Config file
1. Go into the public/includes folder <br />
2. Copy config-example.php to config.php <br />
3. Edit config.php and populate with your info <br />

### Populate scripts folder

#### Option 1: Copy uncompiled scripts
1. Copy .jss files from js-src to public/scripts <br />
2. Rename extensions in public/scripts from .jss to .js <br />

#### Option 2: Compile using Google Closure
The src files are found in js-src/. The included makefile utilizes 
the Google Closure Compiler. <br />

1. cd js-src/ <br />
2. Edit makefile and set the location of compiler.jar <br />
3. make <br />
4. make install <br />

### Setup Web Server
Point your webserver at the public folder.

## Attributions

* OAuth2 https://www.elance.com/q/api2/examples/oauth/php
* InfoBox (Apache 2.0 License) https://code.google.com/p/google-maps-utility-library-v3/
* OverlappingMarkerSpiderfier (MIT License) https://github.com/jawj/OverlappingMarkerSpiderfier
* Neteye Activity Indicator (MIT License) https://github.com/neteye/jquery-plugins
* php-sample-person-browser https://github.com/justincy/php-sample-person-browser
* Journalness https://github.com/dawithers/journalness
