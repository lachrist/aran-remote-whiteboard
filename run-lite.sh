killall node
pkill -f firefox
node whiteboard/aran-lite/proxy.js 8080 &
node socket.io-examples/whiteboard/index.js &
sleep 2
/Applications/Firefox.app/Contents/MacOS/firefox-bin -private -devtools "http://localhost:3000/index.html?otiluke-alias=client1&otiluke-marker=FOOBAR" &