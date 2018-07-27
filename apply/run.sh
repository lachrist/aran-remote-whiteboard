killall node
node ../node_modules/aran-remote/bin.js --remote-analysis remote-analysis.js --node-port 8000 --log &
#--browser-port 8080 --ca-home /Users/soft/Desktop/workspace/otiluke/browser/ca-home/ &
sleep 2
node ../node_modules/aran-remote/node/bin.js --host localhost:8000 --alias server -- $1 &
# sleep 5
# /Applications/Firefox.app/Contents/MacOS/firefox-bin -private "http://localhost:3000/index.html?otiluke-alias=client1" -new-tab -url "http://localhost:3000/index.html?otiluke-alias=client2"