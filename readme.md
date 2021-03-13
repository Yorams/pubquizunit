
Pubquiz unit is a quiz system thats presents questions live to any team. It is possible for the quizmaster present the next question on his cue. Teams can only answer once. There is a live scoreboard and an answer overview to see the given answers for each team. It is possible to edit the teams and question via the webinterface.

**I will update this repo reguarlly. This was originally made for a one time event, but i'm improving it to use it for generic use.**

# How to install
- Clone the git repository or download and extract all the files to a folder on your disk. Go to the folder and run:	

	    npm install

Once installed everything rename the "settings_empty.json" to "settings.json" and fill in the database settings.

# How to use
To control the quiz or create teams you must login. Default is: admin & pubquizunit:

	https://<IP or HOST>

- Create teams at the "Teams" page.
- Add rounds and questions at the "Questions" page
- If you have added Teams and Questions you can give the teams their own team link and control the quiz at the "Control" page.

To delete all answers and reset the quiz progress run the following:
	
	npm run reset_quiz

# Question Templates File:
It is possible to add a custom question template in question_templates.json. There are 4 default input types:
- radio: Presents answers as a single choice option.
- checkbox: Presents answers as multiple choice options. If an incorrect answer is checked, half a point is subtracted.
- text: Presents a input field for text. The correct and the given answer is compared and is gets a score based on similarity.
- number: Presents a number input field.

# Other info
## Service file
Create a service file a .... with the following contents:

	[Unit]
	Description=Pubquiz Unit Server

	[Service]
	ExecStart=/folder/to/pubquizunit/bin/www
	Restart=always
	User=root
	Group=root
	Environment=PATH=/usr/bin:/usr/local/bin
	Environment=NODE_ENV=production
	WorkingDirectory=/folder/to/pubquizunit/bin

	[Install]
	WantedBy=multi-user.target

After that you can start and stop the service with this commands:

	sudo systemctl start pubquizunit.service
	sudo systemctl restart pubquizunit.service

To view the log enter this:

	journalctl -u pubquizunit.service
	