/*
Note: You a a super forgetful chief of a village, who wants to 
Note: get things done and writes things down in the order you
Note: want them to happen. These are your notes for today:

Call for the villager named Alan.
Call for the villager named Bertrand.
Call for the villager named Charles.
Call for the villager named Dennis.

Tell Alan to make a blueprint for a structure that requires 10 wood and 5 stone.
Tell Charles to gather 10 wood.
Tell Dennis to mine 6 stone.

Note: This doesn't count as a command, and neither do 
Note: blank lines.

Note: While we are waiting, here's a hello world program.
Call for the villager named Edsger.
Tell Edsger to write the text "Hello, world!" on his scroll.
Tell Edsger to post his scroll to the Community Message Board.

Tell Bertrand to build a structure using Alan's blueprint, Charles's wood, and Dennis's stone.

Tell Dennis to mine 5 stone.

Note: Also, if you call villagers using the wrong pronoun,
Note: you will have problems.

Note: this errors, because Edsger is male and prefers the use of "his".
Tell Edsger to write the text "example" on her scroll.

Note: If you think I'm being an jerk because of this, 
Note: check the comment on line 79 in main.js.
*/

window.onload = function () {
  var codeInput = document.getElementById("input")
  var lineNumbers = document.getElementById("lineNumbers")
  codeInput.onkeyup = codeInput.onchange = codeInput.onkeydown = function (event) {
    var row_number = 0;
    lineNumbers.innerHTML = "";
    codeInput.value.split("\n").forEach(function (row) {
      row_number++;
      lineNumbers.innerHTML += row_number + "\n";
    });
    lineNumbers.cols = Math.floor(1 + Math.log10(row_number));
  }

  codeInput.onscroll = function (event) {
    lineNumbers.scrollTop = codeInput.scrollTop;
  }
  var row_number = 0;
  lineNumbers.innerHTML = "";
  codeInput.value.split("\n").forEach(function (row) {
    row_number++;
    lineNumbers.innerHTML += row_number + "\n";
  });
  lineNumbers.cols = Math.floor(1 + Math.log10(row_number));
}




var DEBUG = true;

var occupations = {
  "lumberjack": "wood",
  "quarryman": "stone",
  "architect": "blueprint",
  "builder": "None"
}

var occupationActions = {
  "lumberjack": "gather (\\d+) wood",
  "quarryman": "(?:mine|quarry) (\\d+) stone",
  "architect": "(?:create|draft|make) a blueprint for a structure (?:(?:that requires)|(?:requiring)) (\\d+|no) wood and (\\d+|no) stone",
  "builder": "build a structure using (\\w+)'s blueprint, (\\w+)'s wood, and (\\+) stone."
}

var generalActions = [
  ['write the text "([^"]+)" on (\\w+) scroll',
    function (matches, villager, line) {
      if (matches[2] == villager.genderPronoun) {
        villager.scroll.text += matches[1];
        logToConsole('Successfully wrote the text "' + matches[1] + '" on ' + villager.name + "'s scroll.");
        return true;
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '"  over "' + matches[2] + '".'); // I'm not trying to be controversial/rude/edgy/ignorant of other's preferences or feelings. In fact, I'm being quite the opposite. You should always call someone by what they prefer.
        return false;
      }
    }
  ],
  ["write the text '([^']+)' on (\\w+) scroll",
    function (matches, villager, line) {
      if (matches[2] == villager.genderPronoun) {
        villager.scroll.text += matches[1];
        logToConsole('Successfully wrote the text "' + matches[1] + '" on ' + villager.name + "'s scroll.");
        return true;
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        return false;
      }
    }
  ],
  ["post (\\w+) scroll (?:on|to) the [Cc]ommunity [Mm]essage [Bb]oard",
    function (matches, villager, line) {
      if (matches[1] == villager.genderPronoun) {
        if (villager.scroll.text === '') {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + "'s scroll does not have any text to post!");
          return false;
        } else {
          postToMessageBoard(villager.scroll);
          logToConsole(villager.name + " successfully posted " + villager.genderPronoun + " scroll to the message board and returned with a clean one.");
          villager.scroll.text = "";
          return true;
        }
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        return false;
      }
    }
  ]
];

var occupationNames = Object.keys(occupations);
occupationNames.sort();

function getOccupation(name) {
  if (malevillagers.indexOf(name) != -1) {
    return occupationNames[malevillagers.indexOf(name) % occupationNames.length]
  } else {
    throw new Error("That villager is not available.");
  }
}

function Villager(name, gender, occupation) {
  function getSpecialItem(occupation) {
    return occupations[occupation]
  }
  this.name = name;
  this.genderPronoun = gender == "male" ? "his" : "her";
  this.genderPronoun2 = gender == "male" ? 'he' : 'she';
  this.gender = gender;
  this.occupation = occupation;
  this.scroll = new Scroll('');
  this.cooldown = 0;
  this.ontaskcompletion = new Item();
  this.specialItem = null;
  this.specialItemType = getSpecialItem(occupation);
}

function Item(type, quantity, value) {
  this.type = type;
  this.quantity = quantity;
  this.value = value || undefined;
}

function Scroll(text) {
  this.text = text;
}

function postToMessageBoard(scroll) {
  document.getElementById("messageBoard").value += scroll.text;
}

// I'm choosing names of people who had an impact on computer science, programming, or mathematics. Generally, I'm using names that sound relatively English. Sorry Ramanujan.
var malevillagers = [
  "Alan", // Turing
  "Bertrand", // Russell
  "Charles", // Babbage
  "Dennis", // Ritchie
  "Edsger", // Dijkstra, might be a bit of a stretch for my final rule.
  "Felix",
  "George", // Boole
  "John", // von Neumann
  "Ken", // Thompson
  "Linus" // Torvalds (I'm not sure if this fully qualifies against my specifications, but unfortunately my list of options is quite limited: https://en.wikipedia.org/wiki/List_of_pioneers_in_computer_science )
  /* TODO: add more names */
]

/* TODO: add female villagers */

var villagers = {};

function parse() {
  var text = document.getElementById('input').value;
  villagers = {};
  document.getElementById("messageBoard").value = "";
  document.getElementById("console").value = "";
  var line = 0;
  var commands = text.split('\n');
  while (line < commands.length) {
    var command = commands[line];
    var didCommand = false;
    if (!command.toLowerCase().startsWith("note: ") && command.length) {
      if (command.startsWith("Call")) {
        var match = command.match(/Call for the villager named (\w+)\./);
        if (match) {
          match = match[1];
          if (malevillagers.indexOf(match) != -1 && !villagers[match]) {
            logToConsole("Successfully called for the villager named " + match + ".");
            didCommand = true;
            villagers[match] = new Villager(match, "male", occupationNames[malevillagers.indexOf(match) % occupationNames.length]);
          } else {
            logToConsole("That villager is unavailable or you already called for that villager.");
          }
        } else {
          logToConsole("Syntax Error on line " + (line + 1) + ": Should be \"Call for the villager named <name>.\", where <name> is an villager name. There is a list of valid villager names in the documentation.");
        }
      } else {
        if (command.startsWith("Tell")) {
          var matches = command.match(/Tell (\w+) to ([^\.]+)\./);
          var villagerName = matches[1];
          var action = matches[2];
          var villager = villagers[villagerName];
          if (villager && villager.cooldown === 0) {
            var matches = action.match(new RegExp(occupationActions[villager.occupation]));
            if (matches) {
              villager.cooldown = 3;
              if (matches.length == 2) {
                villager.ontaskcompletion = new Item(villager.specialItemType, parseInt(matches[1]));
                logToConsole("Successfully told " + villager.name + " to " + action + ". It will be ready in 3 commands.");
                didCommand = true;
              } else {
                if (villager.occupation == "architect") {
                  if (villager.specialItem == null) {
                    villager.ontaskcompletion = new Item("blueprint", 1, {
                      stone: isNaN(parseInt(matches[1])) ? 0 : parseInt(matches[1]),
                      wood: isNaN(parseInt(matches[2])) ? 0 : parseInt(matches[2])
                    });
                    logToConsole("Successfully told " + villager.name + " to create a blueprint. It will be ready in 3 commands.");
                    didCommand = true;
                  } else {
                    logToConsole(villager.name + " already has a blueprint, which needs to be used before another can be created.");
                  }
                } else {
                  if (villager.occupation == "builder") {
                    villager.cooldown = 5;
                    var architect = matches[1];
                    var lumberjack = matches[2];
                    var quarryman = matches[3];
                    quarryman.specialItem -= architect.specialItem.stone;
                    lumberjack.specialItem -= architect.specialItem.wood;
                    logToConsole("Successfully told " + villager.name + " to build a structure. It will be complete in 5 commands.");
                    didCommand = true;
                  }
                }
              }
            } else {
              generalActions.forEach(data => {
                var actionRegEx = data[0];
                var successCallback = data[1];
                match = action.match(new RegExp(actionRegEx));
                if (match) {
                  if (successCallback(match, villager, line)) {
                    didCommand = true;
                  }
                }
              });
            }
          }
        }
      }
      if (didCommand) {
        Object.keys(villagers).map(name => {
          if (villagers[name].cooldown > 0) {
            villagers[name].cooldown -= 1;
            if (villagers[name].cooldown == 0) {
              if (villagers[name].ontaskcompletion.value === undefined) {
                if (villagers[name].specialItem === null) {
                  villagers[name].specialItem = villagers[name].ontaskcompletion;
                  logToConsole(name + " has finished collecting " + villagers[name].ontaskcompletion.quantity + " " + villagers[name].specialItemType + ". This is all of the " + villagers[name].specialItemType + " " + villagers[name].genderPronoun2 + " has.");
                } else {
                  villagers[name].specialItem.quantity += villagers[name].ontaskcompletion.quantity;
                  logToConsole(name + " has finished collecting " + villagers[name].ontaskcompletion.quantity + " " + villagers[name].specialItemType + ". They now have " + villagers[name].specialItem.quantity + ' ' + villagers[name].specialItemType + ".");
                }
              } else {
                villagers[name].specialItem = villagers[name].ontaskcompletion;
                logToConsole(name + " has finished " + villagers[name].genderPronoun + " task.")
              }
              villagers[name].ontaskcompletion = null;
            }
          }
        });
      }
    }
    line++;
  }
}

if (!DEBUG) {
  logToConsole = x => {}
} else {
  logToConsole = function (text) {
    document.getElementById("console").value += '> ' + text + "\n";
  }
}