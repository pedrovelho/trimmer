

# trimmer

trimmer is a Trello time tracker written in nodejs that keeps track of the time spent per card 
on each list (column). This is useful to see your agile pipeline performance and improve your team.

Trello API works with rest. Trello is organized in boards, each board has several columns. 
Each column is called a list, in Trello jargon. A list is a set of cards, cards go from one list 
to another until they reach the final goal mostly in a pipeline like style. To be consise with 
Trello jargon we use list and listid to identify columns throught this documentation.

## How to configure

You *must* to provide:

* Trello API KEY   (see next topic)
* Trello API TOKEN (see next topic)
* List of columns' (lists) ids that you want to track

You can *optionally* provide: 

* List of cards you want to remove, for instance title cards
* Card id to publish your statistics, so you we will se in the Trello board

## How to get Trello API KEY and TOKEN

To start you need an API key, visit the link below logged with a valid user to retrieve your
APIKEY.

https://trello.com/app-key

After you need to generate a token, the URL below will do that if you replace
{APIKEY} by the key you retrieved previously.

https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&name=Server%20Token&key={APIKEY}

Once you get both APIKEY and TOKEN you can target a specific board by using the boardId. This is found on the board
URL in trello. For instance, in the board URL : https://trello.com/b/BXYZ/dev, 'BXYZ' is the boardId.
Using the API to list all columns in this card is pretty straight forward (replace {APIKEY} and {TOKEN} accordingly:

[https://trello.com/1/boards/BXYZ/lists?fields=name,url&key={APIKEY}&token={TOKEN}](https://trello.com/1/boards/McOPsJJB/lists?fields=name,url&key={APIKEY}&token={TOKEN})

Two more examples below:

1- `https://trello.com/1/lists/LXYZ/cards?fields=all&key={APIKEY}&token={APITOKEN}`

2- `https://trello.com/1/cards/CXYZ/actions?fields=all&key={APIKEY}&token={APITOKEN}`

## Installation Linux (apt-get based distribution)

First install nodejs and npm, for instance:

```bash
apt get installl nodejs npm
```
After install dependencies with npm.

```bash
npm install
```

Now just run in your terminal of choice, use `-h` for help.

```bash
./trimmer.js
```



