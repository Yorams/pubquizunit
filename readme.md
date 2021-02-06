
Pubquiz unit is a quiz system thats presents questions live to any team. It is possible for the quizmaster present the next question on his cue. Teams can only answer once. There is a live scoreboard and an answer overview to see the given answers for each team.

# This repo is work in progress and far from done.
**Right now the database is working with CouchDB. But this is not ideal for me. So i'm migrating to SQLite3. Thats not in this version. I will update this repo reguarlly. This was originally made for a one time event, but i'm improving it to use it for generic use**

# How to install
- Clone the git repository or download and extract all the files to a folder on your disk. Go to the folder and run:	

	    npm install
- Install CouchDB: https://docs.couchdb.org/en/stable/install/index.html

Once installed everything rename the "settings_empty.json" to "settings.json" and fill in the database settings.

# Other info
## Things to edit on question templates:
	question_templates.pug
	quiz_public.js
	score_controller.js
	common_public.js
	control_public.js
	websocket.js

## Service file
	[Unit]
	Description=Pubquiz Unit Server

	[Service]
	ExecStart=/home/bitnami/pubquizunit/bin/www
	Restart=always
	User=root
	Group=root
	Environment=PATH=/usr/bin:/usr/local/bin
	Environment=NODE_ENV=production
	WorkingDirectory=/home/bitnami/pubquizunit/bin

	[Install]
	WantedBy=multi-user.target


## Shortcuts
	journalctl -u pubquizunit.service
	sudo systemctl start pubquizunit.service
	sudo systemctl restart pubquizunit.service

# TODO
- ALLOT!
- iets verzinnen voor current question and round systeem
- Question/round tel systeem herzien zodat er intro's en einde's in kunnen.
    Evt aan en uit te kunnen zetten in de round settings.
