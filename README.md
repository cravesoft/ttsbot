**Important Note:**
It is based on undisclosed proprietary software.

- - -

# Overview

This IRC bot converts logs into speech and broadcast them as an audio stream.


# Installation 

## Get the source

Clone the git repository:

``` bash
git clone git@github.com:cravesoft/ttsbot.git
```

## Install dependencies

For Ubuntu, simply enter the following command that will install all necessary packages:

``` bash
sudo apt-get install liquidsoap icecast2 sox 
```

The server runs on nodejs and requires the following npm libraries:

- irc
- request

All of them can be installed via `npm install -d` (this will install a local copy of all the dependencies in the node_modules directory)

# Configuration

Rename the config-sample.json file to config.json

Open config.json in a text editor and fill in your server information

# Done!

Then run `node server/js/ttsbot.js` in order to start the server.
