killall node
# pkill -f firefox
node ../node_modules/aran-remote/bin.js --remote-analysis remote-analysis-2.js --node-port 8000 --browser-port 8080 --ca-home /Users/soft/Desktop/workspace/otiluke/browser/ca-home/ &
sleep 2
# node ../../socket.io-examples/whiteboard/index.js &
node ../node_modules/aran-remote/node/bin.js --host localhost:8000 --alias server -- ../../socket.io-examples/whiteboard/index.js &
sleep 5
/Applications/Firefox.app/Contents/MacOS/firefox-bin -private -devtools "http://localhost:3000/index.html?otiluke-alias=client1" &