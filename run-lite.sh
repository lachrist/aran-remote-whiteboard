killall node
node ./server.js --analysis analysis.js --browser-port 8080 --node-port 8000 &
node whiteboard/index.js &
node ./node_modules/aran-lite/node/bin.js --analysis analysis.js --host localhost:8000 --alias server -- whiteboard/index.js &
sleep 5
/Applications/Firefox.app/Contents/MacOS/firefox-bin -private "http://localhost:3000/index.html?otiluke-alias=client1" -new-tab -url "http://localhost:3000/index.html?otiluke-alias=client2"