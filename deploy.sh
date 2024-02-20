echo CLIENT_ID=$CLIENT_ID >> .env
echo CLIENT_SECRET=$CLIENT_SECRET >> .env
echo base_url=$base_url >> .env
echo DEPLOYMENT=1 >> .env
echo DATABASE_URL=$DATABASE_URL >> .env
echo $CREDENTIALS >> credentials.json

wc -l .env
cat credentials.json