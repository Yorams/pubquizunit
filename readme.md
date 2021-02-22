
Pubquiz unit is a quiz system thats presents questions live to any team. It is possible for the quizmaster present the next question on his cue. Teams can only answer once. There is a live scoreboard and an answer overview to see the given answers for each team.

# This repo is work in progress and far from done.
**I will update this repo reguarlly. This was originally made for a one time event, but i'm improving it to use it for generic use. Some variables and comments are in Dutch...**

# How to install
- Clone the git repository or download and extract all the files to a folder on your disk. Go to the folder and run:	

	    npm install

Once installed everything rename the "settings_empty.json" to "settings.json" and fill in the database settings.

# How to use
To control the quiz or create teams you must login. Default is: admin & pubquizunit:

	https://<IP or HOST>

Teams have there own personal link. The teamlink is:
	
	https://<IP or HOST>/quiz/<GUID>

To delete all answers and reset the quiz progress run the following:
	
	npm run reset_quiz

Questions are defined in questions.json. Right now this is a bit of a mess and maybe hard to understand. I will try to explain.

The first object is an array with quiz rounds. Every round have a name, details, type and another array with questions ("vragen" in Dutch).

Every question has a type, name, details, answers array and a correct answers array. The answers en correct array is different per type of question. If you want to know wat to fill in here, check public/javascript/quiz_public.js. There is some info there.

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


### Handige dingen
https://gist.github.com/NigelEarle/70db130cc040cc2868555b29a0278261