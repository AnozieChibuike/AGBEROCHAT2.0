echo $key >> flask.pem
ssh -i "flask.pem" ubuntu@ec2-3-80-180-122.compute-1.amazonaws.com
cd AGBEROCHAT2.0
git pull
sudo systemctl stop AGBEROCHAT2_0
sudo systemctl daemon-reload
sudo systemctl start AGBEROCHAT2_0
sudo systemctl enable AGBEROCHAT2_0
sudo systemctl restart nginx