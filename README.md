# daikin-remote
Daikin remote for serie ARC433*** decode, encode and ir sender

# decode
> node lirc_decode.js file-name

# encode
lirc_encode.js use for encode the command and checksume will return array of byte (string) 
exp: 01000000

# ir sender
> python irsender.py -cm command -cs checksum

Use encode to get command and checksum then pass to irsender to excute. You can modify number of output pin inside irsender default is 10
