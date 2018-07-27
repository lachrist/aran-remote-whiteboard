killall node
node ./node_modules/aran-remote/bin.js --remote-analysis remote-analysis.js --node-port 8000 --browser-port 8080 &
sleep 2
node ./node_modules/aran-remote/node/bin.js --host localhost:8000 --alias server -- ./whiteboard/index.js &
sleep 5
/Applications/Firefox.app/Contents/MacOS/firefox-bin -devtools -private "http://localhost:3000/index.html?otiluke-alias=client1" -new-tab -url "http://localhost:3000/index.html?otiluke-alias=client2"