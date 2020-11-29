#!/bin/bash
currentPwd = $PWD
cd /home/pi/project/facepicture
git pull
npm update
npm upgrade
/bin/bash patch.sh
sudo systemctl restart facepicture
cd $currentPwd