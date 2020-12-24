#!/bin/bash
#installing source
sudo apt install -y nodejs npm unclutter
#installing process
npm install
/bin/bash patch.sh
#installing environnement
cp install/xsession $HOME/.xsession
sudo cp install/facepicture.service /etc/systemd/system/facepicture.service
echo '0 22 * * * pi /bin/bash /home/pi/project/facepicture/update.sh >/dev/null 2>&1' | sudo tee -a /etc/crontab
sudo systemctl enable facepicture
sudo systemctl start facepicture
