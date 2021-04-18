# Pubquiz Unit

> **A pubquiz system for interactive display of questions with automatic scoring.**

Pubquiz unit is a quiz system thats presents questions live to any team. It is possible for the quizmaster present the next question on his or her cue. There is a live scoreboard and an answer overview to see the given answers for each team.

# Screenshots


<table>
<tbody>
  <tr>
    <td align="center"><img src="https://github.com/Yorams/pubquizunit/blob/v2/screenshots/control.jpg" width="400" ></td>
    <td align="center"><img src="https://github.com/Yorams/pubquizunit/blob/v2/screenshots/questions.jpg" width="400" ></td>
    <td align="center"><img src="https://github.com/Yorams/pubquizunit/blob/v2/screenshots/score.jpg" width="400" ></td>
    <td align="center"><img src="https://github.com/Yorams/pubquizunit/blob/v2/screenshots/teams.jpg" width="400" ></td>
  </tr>
  <tr>
    <td>Quiz Control</td>
    <td>Edit Questions</td>
    <td>See the live score</td>
    <td>Add teams</td>
  </tr>
</tbody>
</table>

### The team page

It is possible to add a stream next to questions

<p align="center">
<img src="https://github.com/Yorams/pubquizunit/blob/v2/screenshots/quiz.jpg">
</p>

# How to install
- Clone the git repository: (or download and extract all the files to a folder on your disk.)

		git clone https://github.com/Yorams/pubquizunit.git
- Go to the folder and rename the "settings_empty.json" to "settings.json" and fill in the database settings.
- If the settings are correct, install the package:	

	    npm install

Because Pubquizunit uses SQLite3, it has to compile the SQLite3 package. Sometimes it's a bitch and it does not want to compile. So if you get allot of errors you can try to install SQLite seperate with root access.

	sudo npm install sqlite3

And then run the npm install again.


# How to use
Start the server with

	sudo node bin/www

The server uses certificates and port 80/443, therefore it has to have elevated rights.

To control the quiz or create teams you must login. ***Default is: admin & pubquizunit:***

	https://<IP or HOST>

- Create teams at the "Teams" page.
- Add rounds and questions at the "Questions" page
- If you have added Teams and Questions you can give the teams their own team link and control the quiz at the "Control" page.

To begin a new quiz, you can delete or rename the database.db file and run npm install again to initiate the database again.

# Question Templates File:
It is possible to add a custom question template in question_templates.json. There are 4 default input types:
- radio: Presents answers as a single choice option.
- checkbox: Presents answers as multiple choice options. If an incorrect answer is checked, half a point is subtracted.
- text: Presents a input field for text. The correct and the given answer is compared and is gets a score based on similarity.
- number: Presents a number input field.

# Other info
## Scoreboard for streaming
There is a spiced up scoreboard for streaming purposes. You can find the scoreboard here:

	https://<IP or HOST>/score/topvideo

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

### ToDo Major
- [x] Add message type question, useable for intro or outros for rounds
- [x] Decent logging
- [x] Add a question overview/list to the control page.
- [x] Let the server also listen to port http to redirect clients to https.
- [ ] Do some costumizable styling.
- [ ] Make a settings page to adjust settings.
- [ ] Update order by removing question. Current update mechanism is triggered by frontend. Must do it in backend.

### ToDo Minor
- Better user feedback of broken websocket connections
