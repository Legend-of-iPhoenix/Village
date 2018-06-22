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
Note: check the comment here: https://github.com/Legend-of-iPhoenix/Village/blob/a8d53ad79a76b9bb129c75165c4a5ad67179e25d/main.js#L89
*/
var DEBUG = true, logToConsole;

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
  document.getElementById("showConsole").onchange = function (event) {
    if (event.target.checked) {
      document.getElementById("consoleHeader").style.display = document.getElementById("console").style.display = "block";
    } else {
      document.getElementById("consoleHeader").style.display = document.getElementById("console").style.display = "none";
    }
    DEBUG = event.target.checked;

  }
}

var occupations = {
  "lumberjack": "wood",
  "quarryman": "stone",
  "architect": "blueprint",
  "builder": false // the builder builds buildings, but doesn't have its own item. This is easy to check for.
}

var occupationActions = {
  "lumberjack": "(?:gather|collect|harvest) (\\d+) wood",
  "quarryman": "(?:mine|quarry) (\\d+) stone",
  "architect": "(?:create|draft|make) a blueprint for a structure (?:(?:that requires)|(?:requiring)) (\\d+|no) wood and (\\d+|no) stone",
  "builder": "build a structure using (\\w+)'s blueprint, (\\w+)'s wood, and (\\+) stone"
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
  ],
  ["write the (?:amount|number) of (\\w+) (\\w+) has on (\\w+) scroll",
    function (matches, villager, line) {
      if (matches[2] == villager.genderPronoun2) {
        if (matches[3] == villager.genderPronoun) {
          if ((matches[1] == villager.specialItemType || (matches[1] == villager.specialItemType + 's')) && villager.specialItemType && villager.specialItem) {
            villager.scroll.text += villager.specialItem.quantity + '';
            return true;
          } else {
            villager.scroll.text += "0"
            return true;
          }
          logToConsole(villager.name + " successfully wrote the amount of " + matches[1] + " that " + villager.genderPronoun2 + " has on "+ villager.genderPronoun + " scroll.");
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[3] + '".');
          return false;
        }
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun2 + '" over "' + matches[2] + '".');
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
  document.getElementById("messageBoard").value += scroll.text + '\n';
}

function Routine(name, start, end) {
  this.name = name;
  this.start = start;
  this.end = end;
}

// I'm choosing names of people who had an impact on computer science, programming, or mathematics. Generally, I'm using names that sound relatively English. Sorry Ramanujan.
var malevillagers = [
  "Alan", // Turing
  "Bertrand", // Russell
  "Charles", // Babbage
  "Dennis", // Ritchie
  "Edsger", // Dijkstra, might be a bit of a stretch for my final rule.
  "Felix", // placeholder
  "George", // Boole
  "John", // von Neumann
  "Ken", // Thompson
  "Linus" // Torvalds (I'm not sure if this fully qualifies against my specifications, but unfortunately my list of options is quite limited: https://en.wikipedia.org/wiki/List_of_pioneers_in_computer_science )
  /* TODO: add more names */
]

var femalevillagers = [
  "Ada" // Lovelace. This was a natural choice.
  /* TODO: add more names */
]

var villagers = {};
var routines = {};


// I should probably make an AST instead of using a bunch of if statements and regexes, but this isn't going to be that complex of a language.
// Well, it'll be very complex, but not in the way that an AST helps with.
function run() {
  if (!DEBUG) {
    logToConsole = x => {}
  } else {
    logToConsole = function (text) {
      document.getElementById("console").value += '> ' + text + "\n";
    }
  }
  var text = document.getElementById('input').value;
  villagers = {};
  document.getElementById("messageBoard").value = "";
  document.getElementById("console").value = "";
  var line = 0;
  var commands = text.split('\n');
  var indentLevel = 0;
  while (line < commands.length) {
    var command = commands[line];
    var numSpaces = command.match(/^ */)[0].length;
    if (numSpaces && !command.substring(numSpaces).startsWith('-+*'.charAt((numSpaces-1)%3))) {
      logToConsole("Indentation Error on line " + (line+1) + ": Expected '" + '-+*'.charAt((numSpaces-1)%3) + "', recieved '" + command.charAt(numSpaces + 1));
    }
    indentLevel = numSpaces;
    command = command.substring(indentLevel + (!!indentLevel)).trim();
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
            if (femalevillagers.indexOf(match) != -1 && !villagers[match]) {
              logToConsole("Successfully called for the villager named " + match + ".");
              didCommand = true;
              villagers[match] = new Villager(match, "female", occupationNames[femalevillagers.indexOf(match) % occupationNames.length]);
            } else {
              logToConsole("That villager is unavailable or you already called for that villager.");
            }
          }
        } else {
          logToConsole("Syntax Error on line " + (line + 1) + ": Should be \"Call for the villager named <name>.\", where <name> is an villager name. There is a list of valid villager names in the documentation.");
        }
      } else {
        if (command.startsWith("Tell")) {
          var matches = command.match(/Tell (\w+) to (.+)\./);
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
                  console.log(match);
                  if (successCallback(match, villager, line)) {
                    didCommand = true;
                  }
                }
              });
            }
          }
        } else {
          if (command.startsWith("Ask")) {
            var matches = command.match(/Ask (\w+) if (\w+) has (any|\d+) (\w+)s?\./);
            if (matches) {
              var villager = villagers[matches[1]];
              var pronoun = matches[2];
              var amount = matches[3] == "any" ? 1 : parseInt(matches[3]);
              var material = matches[4];
              if (villager && villager.cooldown === 0) {
                if (pronoun == villager.genderPronoun2) {
                  indentLevel++;
                  var lookingFor = "doesn't";
                  if (villager.specialItemType == material && villager.specialItem && villager.specialItem.quantity >= amount) {
                    lookingFor = "does";
                  }
                  lookingFor = "If " + villager.genderPronoun2 + " " + lookingFor + ":";
                  var indentLevel2 = indentLevel;
                  var line2 = line;
                  var threwError = false;
                  while (line2 < commands.length && !(commands[line2].substring(indentLevel2 + (!!indentLevel2)).trim().startsWith(lookingFor) && indentLevel2 == indentLevel) && indentLevel2 >= indentLevel) {
                    line2++;
                    var numSpaces = commands[line2].match(/^ */)[0].length;
                    if (numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces-1)%3))) {
                      logToConsole("Indentation Error on line " + (line+1) + ": Expected '" + '-+*'.charAt((numSpaces-1)%3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
                      threwError = true;
                      break
                    }
                    indentLevel2 = numSpaces;
                  }
                  if (line2 < commands.length && !threwError) {
                    line = line2;
                    didCommand = true;
                  }
                } else {
                  logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun2 + '" over "' + matches[2] + '".');
                }
              } else {
                logToConsole("You have not called for that villager yet or that villager is unavailable.");
              }
            }
          } else {
            if (command.startsWith("If")) {
              var indentLevel2 = indentLevel;
              var line2 = line;
              var threwError = false;
              while (line2 < commands.length && indentLevel2 >= indentLevel) {
                line2++;
                var numSpaces = commands[line2].match(/^ */)[0].length;
                if (numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces-1)%3))) {
                  logToConsole("Indentation Error on line " + (line+1) + ": Expected '" + '-+*'.charAt((numSpaces-1)%3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
                  threwError = true;
                  break
                }
                indentLevel2 = numSpaces;
              }
              if (line2 < commands.length && !threwError) {
                line = line2 - 1;
              }
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
