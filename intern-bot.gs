const baseUrl = "https://us-west-2.aws.data.mongodb-api.com/app/data-xcxnf/endpoint/data/v1/action";
const API = {
  InsertMany: baseUrl + "/insertMany",
  Find: baseUrl + "/find",
  UpdateOne: baseUrl + "/updateOne",
  DeleteOne: baseUrl + "/deleteOne",
}
const properties = PropertiesService.getScriptProperties();
const DB_API_KEY = properties.getProperty("mongodb_api_key");
const CHANNEL_ACCESS_TOKEN = properties.getProperty("channel_access_token");
const GROUP_ID = properties.getProperty("group_id");

function InternBot() {
  const url = 'https://raw.githubusercontent.com/pittcsc/Summer2024-Internships/dev/README.md';

  const rawContent = UrlFetchApp.fetch(url).getContentText();

  const rawLine = [];

  rawContent.split(/\r?\n/).map((line) => {
    if (line[0] === '|') {
      rawLine.push(line);
    }
  });

  const internList = [];

  rawLine.splice(2).map((line) => {
    internList.push(parseLine(line));
  })

  const companyList = getNameListFromDB();

  const companyNameList = companyList.map(({ name }) => name);

  const newInternList = internList.filter(({ name }) => !companyNameList.includes(name));

  const updateInternList = internList.filter((intern) => {
    const originItem = companyList.find(({ name }) => name === intern.name)
    return originItem.position !== intern.position;
  })

  if (newInternList.length > 0 || updateInternList.length > 0) {
    broadcastMessage([...newInternList, ...updateInternList]);
  }

  if (newInternList.length > 0) {
    saveInternListToDB(newInternList);
  }

  if (updateInternList.length > 0) {
    updateInterListToDB(updateInternList);
  }

  const newCompanyNameList = internList.map(({ name }) => name);

  companyNameList.forEach((name) => {
    if (!newCompanyNameList.includes(name)) {
      deleteFromDB(name);
    }
  })
}

const deleteFromDB = (name) => {
  const data = JSON.stringify({
    collection: "intern",
    database: "intern-summer-24",
    dataSource: "Cluster0",
    filter: { name }
  });

  const config = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': DB_API_KEY,
    },
    payload: data
  };

  const res = UrlFetchApp.fetch(API.DeleteOne, config);
}

const updateInterListToDB = (updateInternList) => {
  updateInternList.forEach(({ name, position, links }) => {
    const data = JSON.stringify({
      collection: "intern",
      database: "intern-summer-24",
      dataSource: "Cluster0",
      filter: { name },
      update: {
        "$set": {
            position: position,
            links: links,
        }
      }
    });

    const config = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': DB_API_KEY,
      },
      payload: data
    };

    const res = UrlFetchApp.fetch(API.UpdateOne, config);
  })
}

const saveInternListToDB = (filteredInternList) => {
  const data = JSON.stringify({
    collection: "intern",
    database: "intern-summer-24",
    dataSource: "Cluster0",
    documents: filteredInternList,
  });

  const config = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': DB_API_KEY,
    },
    payload: data
  };

  const res = UrlFetchApp.fetch(API.InsertMany, config);
}

const getNameListFromDB = () => {
  const data = JSON.stringify({
    collection: "intern",
    database: "intern-summer-24",
    dataSource: "Cluster0",
  });

  const config = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': DB_API_KEY,
    },
    payload: data
  };

  const res = UrlFetchApp.fetch(API.Find, config);

  const companyList = JSON.parse(res).documents;

  return companyList;
}

const parseLine = (line) => {
  const strs = line.split('| ');
  const internInfo = Object();
  const regex = /(?=\[(!\[.+?\]\(.+?\)|.+?)]\((https:\/\/[^\)]+)\))/g;
  const links = [];

  if ([...strs[1].matchAll(regex)].length > 0) {
    [...strs[1].matchAll(regex)].map((m) => {
      internInfo['name'] = m[1];
      links.push(m[2]);
    })
  } else {
    internInfo['name'] = strs[1].trim();
  }

  if (strs[2].includes("<br/>")) {
    internInfo['location'] = 'Multiple US Locations';
  } else {
    internInfo['location'] = strs[2].trim();
  }

  strs[3] = strs[3].replace(' <br/> ', '').replace('|', '').trim();

  if ([...strs[3].matchAll(regex)].length > 0) {
    let prev = 0;
    let positionInfoStr = '';
    [...strs[3].matchAll(regex)].map((m) => {
      positionInfoStr += strs[3].substr(prev, m.index) + m[1] + '\n';
      prev = m.index + m.input.length + 1;
      links.push(m[2]);
    })
    internInfo['position'] = positionInfoStr;
  } else {
    internInfo['position'] = strs[3];
  }

  internInfo['links'] = links;

  return internInfo;
}

const broadcastMessage = (internList) => {
  let message = "[New internship information]\n\n\n";

  internList.map(({ name, location, position, links }, idx) => {
    message += `${idx + 1}. ${name} (${location})\n\n${position}\n\n${links.join('\n')}\n\n`;
  });

  message.substring(0, message.length - 4);

  const payload = {
    to: GROUP_ID,
    messages: [{
      'type': 'text',
      'text': message
    }]
  };

  const option = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    'method': 'post',
    'payload': JSON.stringify(payload)
  };

  UrlFetchApp.fetch(
    'https://api.line.me/v2/bot/message/push',
    option
  );
}