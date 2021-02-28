
Pubquiz unit is a quiz system thats presents questions live to any team. It is possible for the quizmaster present the next question on his cue. Teams can only answer once. There is a live scoreboard and an answer overview to see the given answers for each team.

# This repo is work in progress and far from done.
**The work in this brance is halted. I'm continuing the development in the V2 branch: https://github.com/Yorams/pubquizunit/tree/v2**

# How to install
- Clone the git repository or download and extract all the files to a folder on your disk. Go to the folder and run:	

	    npm install

Once installed everything rename the "settings_empty.json" to "settings.json" and fill in the database settings.

# How to use

Teams have there own personal link, defined in teams.json. The teamlink is:
	
	https://<IP or HOST>/quiz/<GUID>

To control the quiz you can go to the following url. Default is: admin & pubquizunit:

	https://<IP or HOST>/control/

The answer overview is here:
	
	https://<IP or HOST>/score/

And the scoreboard here:
	
	https://<IP or HOST>/score/top
	

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
