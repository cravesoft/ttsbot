#!/usr/bin/liquidsoap

# Lines starting with # are comments, they are ignored.

# Put the log file in some directory where
# you have permission to write.
set("log.file.path","/tmp/<script>.log")

# Print log messages to the console,
# can also be done by passing the -v option to liquidsoap.
set("log.stdout", true)

# Use the telnet server for requests
set("server.telnet", true)
set("server.telnet.port",1234)

set("scheduler.generic_queues",5)
set("scheduler.fast_queues",3)
set("scheduler.non_blocking_queues",3)

# Play user requests if there are any,
# otherwise the default file.
default = blank(duration=0.1)
radio = fallback([ request.queue(id="request"), default])
#radio = mksafe(request.queue(id="request"))

# Encode and output the source's stream to an icecast2 server in MP3 format.
output.icecast(%mp3,
  host="localhost",port=8000,password="hackme",
  mount="radio.mp3",timeout=1.,radio)

# Output the source's stream to an ALSA output device
#output.alsa(bufferize = false,radio)
