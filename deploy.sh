echo $key >> flask.pem
ssh -i "flask.pem" ubuntu@ec2-3-80-180-122.compute-1.amazonaws.com
cd AGBEROCHAT2.0
git pull
sudo systemctl stop h
sudo systemctl daemon-reload
sudo systemctl start h
sudo systemctl enable h
sudo systemctl restart nginx