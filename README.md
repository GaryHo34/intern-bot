# intern-bot
A google apps script which automatically fetch the information changed from Pittcsc's Summer Intern List

## How it works

1. Fetch the data from MongoDB Atlas

2. Fetch the raw text from the Pittcsc's Summer Intern List

3. Compare the data and find the difference

4. Send the difference to the group chat or private message

## How to use

1. Create a new google script at https://script.google.com/home/start

2. Copy and paste the code from `intern-bot.gs` into the script editor

3. You will need a Message API from Line Business Center. You can get one at https://developers.line.biz/console/

4. Set up channel access token in Properties. See: https://developers.google.com/apps-script/reference/properties/properties-service

5. Set up a MongoDB atlas and get the dataapi and api key. See: https://www.mongodb.com/docs/atlas/api/data-api/

6. Invite your bot to a group chat or set it a private message. Set up a easy backend server to get the group_id or user_id. See: https://developers.line.biz/en/reference/messaging-api/#get-group-member-user-ids

7. Put the group_id or user_id in Properties too.

7. Set up a trigger to run the function `InternBot` every 2 hours