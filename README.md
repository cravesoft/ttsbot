**Important Note:**
This bot is based on undisclosed proprietary software.

- - -

# Overview

This IRC bot converts logs into speech and broadcast them as an audio stream.

Available commands:

* `!tts help`:
    * display the list of available commands
* `!tts [ en-US | ar-XA | cs-CZ | da-DK | de-DE | en-AU | en-GB | es-ES | es-M X |fr-CA | fr-FR | `
  `it-IT | ja-JP | ko-KR | nl-NL | pl-PL | pt-BR | pt-PT | ru-RU | sv-SE | tr-TR | zh-CN ]`:
    * set the language for the IRC user who issued the command
* `!tts pitch [50-200]`:
    * set the pitch of speech for the IRC user who issued the command
* `!tts speed [20-200]`:
    * set the speed of speech for the IRC user who issued the command
* `!tts volume [0-100]]`:
    * set the volume of speech for the IRC user who issued the command

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

Rename the [`server/config-sample.json`](./server/config-sample.json) file to `./server/config.json`

Open `./server/config.json` in a text editor and fill in your server information.

In a TLS/SSL infrastructure, each client and each server must have a private key. A private key is created like this

``` bash
openssl genrsa -out ryans-key.pem 1024
```

All servers and some clients need to have a certificate. Certificates are public keys signed by a Certificate Authority or self-signed. The first step to getting a certificate is to create a "Certificate Signing Request" (CSR) file. This is done with:

``` bash
openssl req -new -key ryans-key.pem -out ryans-csr.pem
```

To create a self-signed certificate with the CSR, do this:

``` bash
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Alternatively you can send the CSR to a Certificate Authority for signing.

# Done!

Then run `liquidsoap ls_script.liq` in order to start the stream generator and `node server/js/ttsbot.js` in order to start the server.
