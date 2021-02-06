# Aanpassen bij nieuwe vraag template:
question_templates.pug
quiz_public.js
score_controller.js
common_public.js
control_public.js
websocket.js

# database gegevens:
localhost
admin
vgopdFY2XM5k

# Service file
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


# Log
journalctl -u pubquizunit.service

sudo systemctl start pubquizunit.service
sudo systemctl restart pubquizunit.service

# TODO
- iets verzinnen voor current question and round systeem
- Question/round tel systeem herzien zodat er intro's en einde's in kunnen.
    Evt aan en uit te kunnen zetten in de round settings.