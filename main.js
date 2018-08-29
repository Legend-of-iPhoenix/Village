var DEBUG = true,
  logToConsole;

window.onload = function() {
  var codeInput = document.getElementById("input");
  var lineNumbers = document.getElementById("lineNumbers");
  codeInput.onkeyup = codeInput.onchange = codeInput.onkeydown = function(event) {
    var row_number = 0;
    lineNumbers.innerHTML = "";
    codeInput.value.split("\n").forEach(function(row) {
      row_number++;
      lineNumbers.innerHTML += row_number + "\n";
    });
    lineNumbers.cols = Math.floor(1 + Math.log10(row_number));
  }

  codeInput.onscroll = function(event) {
    lineNumbers.scrollTop = codeInput.scrollTop;
  }

  var row_number = 0;

  lineNumbers.innerHTML = "";
  codeInput.value.split("\n").forEach(function(row) {
    row_number++;
    lineNumbers.innerHTML += row_number + "\n";
  });
  lineNumbers.cols = Math.floor(1 + Math.log10(row_number));
  document.getElementById("showConsole").onchange = function(event) {
    if(event.target.checked) {
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
  "builder": false, // the builder builds buildings, but doesn't have its own item. I chose false as a placeholder because it is easy to check for.
  "farmer": "wheat",
  "janitor": false
}

var specialOccupations = { // occupations that can have exactly 0 or exactly 1 of their item.
  'architect': function(command, matches, villager, line, villagers) {
    if(villager.specialItem == null) {
      villager.ontaskcompletion = new Item("blueprint", 1, {
        wood: isNaN(parseInt(matches[1])) ? 0 : parseInt(matches[1]),
        stone: isNaN(parseInt(matches[2])) ? 0 : parseInt(matches[2])
      });
      logToConsole("Successfully told " + villager.name + " to create a blueprint. It will be ready in 3 commands.");
      return true;
    } else {
      logToConsole(villager.name + " already has a blueprint, which needs to be used before another can be created.");
      return false;
    }
  },
  'builder': function(command, matches, villager, line, villagers) {
    villager.cooldown = 5;
    var architect = villagers[matches[1]];
    var lumberjack = villagers[matches[2]];
    var quarryman = villagers[matches[3]];
    if(architect.specialItem && quarryman.specialItem.quantity >= architect.specialItem.value.stone && lumberjack.specialItem.quantity >= architect.specialItem.value.wood) {
      quarryman.specialItem.quantity -= architect.specialItem.value.stone;
      lumberjack.specialItem.quantity -= architect.specialItem.value.wood;
      villager.ontaskcompletion = 0;
      if(architect.specialItem.value.stone >= 5 && architect.specialItem.value.wood >= 10) {
        // this is just a fast, calculation of how many more villagers we should add
        // village capacity increase = the maximum amount of houses we can build
        villager.ontaskcompletion = ((r, e) => {
          for(c = 0; r > 0 && e > 0;) r -= 5, e -= 10, c++;
          return c
        })(architect.specialItem.value.stone, architect.specialItem.value.wood)
      }
      logToConsole("Successfully told " + villager.name + " to build a structure. It will be complete in 5 commands.");
      return true
    } else {
      logToConsole("Error on line " + (line + 1) + ": Insufficient building materials!")
      return false
    }
  },
  'janitor': function(command, matches, villager, line, villagers) {
    var number = matches[1] || matches[2];
    if(number == "all") {
      number = messageBoard.length;
    } else {
      number = parseInt(number);
    }
    if(messageBoard.length >= number) {
      var lastScroll;
      for(var i = 0; i < number; i++) {
        lastScroll = messageBoard.pop()
      }
      villager.scroll = lastScroll;
      document.getElementById("messageBoard").value = messageBoard.map(scroll => scroll.text).join('\n') + '\n';
      logToConsole("Successfully told " + villager.name + " to clean " + number + " scroll" + (number != 1 ? 's' : '') + " off of the message board. " + villager.name + " replaced " + villager.genderPronoun + " scroll with the last one " + villager.genderPronoun2 + " removed.")
      return true
    } else {
      logToConsole("Error on line " + (line + 1) + ": There are less than " + number + " scrolls on the message board.")
      return false
    }
  }
}

var occupationTasks = {
  "lumberjack": "(?:harvest|gather|collect) wood",
  "quarryman": "(?:mine|quarry) stone",
  "architect": "draft blueprints",
  "builder": "build structures",
  "janitor": "clean the [Cc]ommunity [Mm]essage [Bb]oard",
  "farmer": "(?:cultivate|grow|harvest|farm) wheat"
}

var occupationActions = {
  "lumberjack": "(?:gather|collect|harvest) (\\d+) wood",
  "quarryman": "(?:mine|quarry) (\\d+) stone",
  "architect": "(?:create|draft|make) a blueprint for a structure (?:(?:that requires)|(?:requiring)) (\\d+|no) wood and (\\d+|no) stone",
  "builder": "build a structure using (\\w+)'s blueprint, (\\w+)'s wood, and (\\w+)'s stone",
  "janitor": "clea(?:n|r) (\\d+|all) messages? off of the [Cc]ommunity [Mm]essage [Bb]oard|remove (\\d+|all) scrolls? from the [Cc]ommunity [Mm]essage [Bb]oard",
  "farmer": "[cultivate|grow|harvest|farm] (\\d+) wheat"
}

var askCommands = [
  [/Ask (\w+) if (\w+) has (any|\d+) (\w+)s?\./,
    function(matches, line, indentLevel, commands, villagers) {
      var didCommand = false;
      var villager = villagers[matches[1]];
      var pronoun = matches[2];
      var amount = matches[3] == "any" ? 1 : parseInt(matches[3]);
      var material = matches[4];
      if(villager && villager.cooldown === 0) {
        if(pronoun == villager.genderPronoun2) {
          indentLevel++;
          var lookingFor = "doesn't";
          if(villager.specialItemType == material && villager.specialItem && villager.specialItem.quantity >= amount) {
            lookingFor = "does";
          }
          lookingFor = "If " + villager.genderPronoun2 + " " + lookingFor + ":";
          var indentLevel2 = indentLevel;
          var line2 = line;
          var threwError = false;
          while(line2 < commands.length && !(commands[line2].substring(indentLevel2 + (!!indentLevel2)).trim().startsWith(lookingFor) && indentLevel2 == indentLevel) && indentLevel2 >= indentLevel) {
            line2++;
            var numSpaces = commands[line2].match(/^ */)[0].length;
            if(numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
              logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
              threwError = true;
              break
            }
            indentLevel2 = numSpaces;
          }
          if(line2 < commands.length && !threwError) {
            line = line2;
            didCommand = true;
          }
          if(indentLevel2 < indentLevel) {
            line = line2 - 1;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun2 + '" over "' + matches[2] + '".');
        }
      } else {
        logToConsole("You have not called for that villager yet or that villager is unavailable.");
      }
      return [line, indentLevel, didCommand]
    }
  ],
  [/Ask (\w+) if (?:the text on )?(\w+) scroll (starts with|ends with|contains) ['"](.+)['"]\./,
    function(matches, line, indentLevel, commands, villagers) {
      var didCommand = false;
      var villager = villagers[matches[1]];
      var pronoun = matches[2];
      var operator = matches[3];
      var text = matches[4];
      if(villager && villager.cooldown === 0) {
        if(pronoun == villager.genderPronoun) {
          indentLevel++;
          var lookingFor = "doesn't";
          if(villager.scroll.text !== '' && ((villager.scroll.text.startsWith(text) && operator == 'starts with') || (villager.scroll.text.endsWith(text) && operator == 'ends with') || (villager.scroll.text.indexOf(text) != -1 && operator == 'contains'))) {
            lookingFor = "does";
          }
          lookingFor = "If it " + lookingFor + ":";
          var indentLevel2 = indentLevel;
          var line2 = line;
          var threwError = false;
          while(line2 < commands.length && !(commands[line2].substring(indentLevel2 + (!!indentLevel2)).trim().startsWith(lookingFor) && indentLevel2 == indentLevel) && indentLevel2 >= indentLevel) {
            line2++;
            var numSpaces = commands[line2].match(/^ */)[0].length;
            if(numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
              logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
              threwError = true;
              break
            }
            indentLevel2 = numSpaces;
          }
          if(line2 < commands.length && !threwError) {
            line = line2;
            didCommand = true;
          }
          if(indentLevel2 < indentLevel) {
            line = line2 - 1;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        }
      } else {
        logToConsole("You have not called for that villager yet or that villager is unavailable.");
      }
      return [line, indentLevel, didCommand]
    }
  ],
  [/Ask (\w+) if (\w+) has (more|less) (\w+) than (\w+)\./,
    function(matches, line, indentLevel, commands, villagers) {
      var didCommand = false;
      var villager = villagers[matches[1]]
      var pronoun = matches[2]
      var comparisonOperator = matches[3]
      var itemType = matches[4]
      var villager2 = villagers[matches[5]]
      if(villager && villager2 && villager.cooldown === 0 && villager2.cooldown === 0) {
        if(villager.genderPronoun2 == pronoun) {
          var lookingFor = "doesn't";
          if(comparisonOperator == "more") {
            if(villager.specialItemType == itemType && villager2.specialItemType == itemType) {
              if(villager.specialItem.quantity > villager2.specialItem.quantity) {
                lookingFor = "does";
              }
            } else {
              if(villager.specialItem == itemType) {
                lookingFor = "does" // the other villager doesn't have any, by default
              }
            }
          } else {
            if(villager.specialItemType == itemType && villager2.specialItemType == itemType) {
              if(villager.specialItem.quantity < villager2.specialItem.quantity) {
                lookingFor = "does";
              }
            } else {
              if(villager2.specialItem == itemType) {
                lookingFor = "does"; // the villager doesn't have any, by default
              }
            }
          }
          lookingFor = "If " + villager.genderPronoun2 + ' ' + lookingFor + ":";
          indentLevel++;
          var indentLevel2 = indentLevel;
          var line2 = line;
          var threwError = false;
          while(line2 < commands.length && !(commands[line2].substring(indentLevel2 + (!!indentLevel2)).trim().startsWith(lookingFor) && indentLevel2 == indentLevel) && indentLevel2 >= indentLevel) {
            line2++;
            var numSpaces = commands[line2].match(/^ */)[0].length;
            if(numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
              logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
              threwError = true;
              break
            }
            indentLevel2 = numSpaces;
          }
          if(line2 < commands.length && !threwError) {
            line = line2;
            didCommand = true;
          }
          if(indentLevel2 < indentLevel) {
            line = line2 - 1;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        }
      } else {
        logToConsole("You have not called for that villager yet or that villager is unavailable.");
      }
      return [line, indentLevel, didCommand]
    }
  ],
  [/Ask (\w+) if (\w+) is an? (\w+)\./, 
    function(matches, line, indentLevel, commands, villagers) {
      var didCommand = false;
      var villager = villagers[matches[1]]
      var pronoun = matches[2]
      var occupation = matches[3]
      if (villager && villager.cooldown === 0) {
        if (villager.genderPronoun2 == pronoun) {
          var lookingFor = "isn't"
          if (occupation.toLowerCase() == villager.occupation) {
            lookingFor = "is"
          }
          lookingFor = "If " + villager.genderPronoun2 + ' ' + lookingFor + ":";
          indentLevel++;
          var indentLevel2 = indentLevel;
          var line2 = line;
          var threwError = false;
          while(line2 < commands.length && !(commands[line2].substring(indentLevel2 + (!!indentLevel2)).trim().startsWith(lookingFor) && indentLevel2 == indentLevel) && indentLevel2 >= indentLevel) {
            line2++;
            var numSpaces = commands[line2].match(/^ */)[0].length;
            if(numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
              logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
              threwError = true;
              break
            }
            indentLevel2 = numSpaces;
          }
          if(line2 < commands.length && !threwError) {
            line = line2;
            didCommand = true;
          }
          if(indentLevel2 < indentLevel) {
            line = line2 - 1;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        }
      } else {
        logToConsole("You have not called for that villager yet or that villager is unavailable.");
      }
      return [line, indentLevel, didCommand]
    }
  ]
]

var generalActions = [
  ['write the text "([^"]+)" on (\\w+) scroll',
    function(matches, villager, line, villagers) {
      if(matches[2] == villager.genderPronoun) {
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
    function(matches, villager, line, villagers) {
      if(matches[2] == villager.genderPronoun) {
        villager.scroll.text += matches[1];
        logToConsole('Successfully wrote the text "' + matches[1] + '" on ' + villager.name + "'s scroll.");
        return true;
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
        return false;
      }
    }
  ],
  ["write (\\w+) occupation on (\\w+) scroll",
    function(matches, villager, line, villagers) {
      if(matches[1] == villager.genderPronoun && matches[2] == villager.genderPronoun) {
        villager.scroll.text += villager.occupation;
        logToConsole("Successfully wrote " + villager.name + "'s occupation on " + villager.genderPronoun + " scroll.");
        return true;
      } else {
        if(matches[1] == villager.genderPronoun) {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[2] + '".');
          return false;
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[1] + '".');
          return false;
        }
      }
    }
  ],
  ["post (\\w+) scroll (?:on|to) the [Cc]ommunity [Mm]essage [Bb]oard",
    function(matches, villager, line, villagers) {
      if(matches[1] == villager.genderPronoun) {
        if(villager.scroll.text === '') {
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
    function(matches, villager, line, villagers) {
      if(matches[2] == villager.genderPronoun2) {
        if(matches[3] == villager.genderPronoun) {
          if((matches[1] == villager.specialItemType || (matches[1] == villager.specialItemType + 's')) && villager.specialItemType && villager.specialItem) {
            villager.scroll.text += villager.specialItem.quantity + '';
            logToConsole(villager.name + " successfully wrote the amount of " + matches[1] + " that " + villager.genderPronoun2 + " has on " + villager.genderPronoun + " scroll.");
            return true;
          } else {
            villager.scroll.text += "0"
            logToConsole(villager.name + " successfully wrote the amount of " + matches[1] + " that " + villager.genderPronoun2 + " has on " + villager.genderPronoun + " scroll.");
            return true;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[3] + '".');
          return false;
        }
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun2 + '" over "' + matches[2] + '".');
        return false;
      }
    }
  ],
  ["(double|triple) (\\w+) (\\w+)",
    function(matches, villager, line, villagers) {
      if(matches[2] == villager.genderPronoun) {
        if(Object.keys(specialOccupations).indexOf(villager.occupation) == -1) {
          if(villager.cooldown == 0) {
            if(matches[3].toLowerCase() == villager.specialItemType) {
              villager.ontaskcompletion = new Item(villager.specialItemType, villager.specialItem.quantity * (matches[1] == 'triple' ? 2 : 1));
              villager.cooldown = 3;
              logToConsole("Successfully told " + villager.name + " to " + matches[1] + ' ' + matches[2] + ' ' + matches[3] + ". It will be ready in 3 commands.");
              return true;
            }
          } else {
            logToConsole("That villager is currently busy!");
            return false;
          }
        }
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun2 + '" over "' + matches[2] + '".');
        return false;
      }
    }
  ],
  ["give (\\w+) (half|(?:a|one) third|all) of (\\w+) (\\w+)",
    function(matches, villager, line, villagers) {
      if(matches[3] == villager.genderPronoun) {
        if(villagers[matches[1]] && villagers[matches[1]].cooldown == 0) {
          if(villager.occupation == villagers[matches[1]].occupation) {
            if(matches[4].toLowerCase() == villager.specialItemType) {
              var amount = Math.floor(villager.specialItem.quantity * (matches[2].indexOf('third') == -1 ? (matches[2] == 'all' ? 1 : .5) : 1 / 3))
              if(villagers[matches[1]].specialItem === null) {
                villagers[matches[1]].specialItem = new Item(villager.specialItemType, 0);
              }
              villagers[matches[1]].specialItem.quantity += amount
              villager.specialItem.quantity -= amount
              logToConsole(villager.name + ' gave ' + matches[1] + ' ' + matches[2] + ' (' + amount + ') of ' + matches[3] + ' ' + matches[4] + '.');
              return true;
            }
          }
        } else {
          logToConsole('That villager is currently busy!');
          return false;
        }
      } else {
        logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[3] + '".');
        return false;
      }
    }
  ],
  ['(?:dispose of|empty|clear) (\\w+) inventory',
    function(matches, villager, line, villagers) {
      if (villager.cooldown === 0) {
        if(matches[1] == villager.genderPronoun) {
          villager.specialItem = null;
          logToConsole('Cleared ' + villager.name + "'s inventory.");
          return true;
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[1] + '".');
          return false;
        }
      } else {
        logToConsole("That villager is currently busy!");
        return false;
      }
    }
  ],
  ['(?:erase|delete|remove) the (last|first) character on (\\w+) scroll',
    function(matches, villager, line, villagers) {
      if (villager.cooldown === 0) {
        if(matches[2] == villager.genderPronoun) {
          if(matches[1] == "last") {
            villager.scroll.text = villager.scroll.text.slice(0, -1);
            logToConsole("Successfully removed the last character on " + villager.name + "'s scroll.")
            return true;
          } else {
            villager.scroll.text = villager.scroll.text.substring(1);
            logToConsole("Successfully removed the first character on " + villager.name + "'s scroll.")
            return true;
          }
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[1] + '".');
          return false;
        }
      } else {
        logToConsole("That villager is currently busy!");
        return false;
      }
    }
  ],
  ['clear (\\w+) scroll',
    function(matches, villager, line, villagers) {
      if (villager.cooldown === 0) {
        if (matches[1] === villager.genderPronoun) {
          villager.scroll.text = '';
          logToConsole("Successfully cleared " + villager.name + "'s scroll.");
          return true;
        } else {
          logToConsole("Error on line " + (line + 1) + ": " + villager.name + " is " + villager.gender + ' and prefers that you use "' + villager.genderPronoun + '" over "' + matches[1] + '".');
          return false;
        }
      } else {
        logToConsole("That villager is currently busy!");
        return false;
      }
    }
  ],
  ['(?:trade|swap) scrolls with (\\w+)',
    function(matches, villager, line, villagers) {
      var villager2 = villagers[matches[1]]
      if(villager2 && villager.cooldown === 0 && villager2.cooldown === 0) {
        var temp = villager.scroll.text;
        villager.scroll.text = villager2.scroll.text;
        villager2.scroll = new Scroll(temp);
        logToConsole("Successfully swapped the scrolls of " + villager2.name + " and " + villager.name + ".");
        return true;
      } else {
        logToConsole("You have not called for that villager yet or that villager is unavailable.");
        return false;
      }
    }
  ]
];

var occupationNames = Object.keys(occupations);
occupationNames.sort();
var messageBoard = []

function Villager(name, gender, occupation) {
  this.name = name;
  this.genderPronoun = gender == "male" ? "his" : "her";
  this.genderPronoun2 = gender == "male" ? 'he' : 'she';
  this.gender = gender;
  this.occupation = occupation;
  this.scroll = new Scroll('');
  this.cooldown = 0;
  this.ontaskcompletion = new Item();
  this.specialItem = null;
  this.specialItemType = undefined;
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
  messageBoard.push(new Scroll(scroll.text)); // shallow copy
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
  if(!DEBUG) {
    logToConsole = x => {}
  } else {
    logToConsole = function(text) {
      document.getElementById("console").value += '> ' + text + "\n";
    }
  }
  var text = document.getElementById('input').value;
  villagers = {};
  messageBoard = [];
  document.getElementById("messageBoard").value = "";
  document.getElementById("console").value = "";
  var villagerLimit = 4;
  var line = 0;
  var commands = text.split('\n');
  var indentLevel = 0;
  var infinteLoopProtection = 1000; // TODO: allow changing of this
  while(line < commands.length && infinteLoopProtection > 0) {
    infinteLoopProtection--;
    var command = commands[line];
    var numSpaces = command.match(/^ */)[0].length;
    if(numSpaces && !command.substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
      logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + command.charAt(numSpaces + 1));
    }
    indentLevel = numSpaces;
    command = command.substring(indentLevel + (!!indentLevel)).trim();
    var didCommand = false;
    if(!command.toLowerCase().startsWith("note: ") && command.length) {
      if(command.startsWith("Call")) {
        var match = command.match(/Call for the villager named (\w+)\./);
        if(match) {
          match = match[1];
          if(villagerLimit > Object.keys(villagers).length) {
            if(malevillagers.indexOf(match) != -1 && !villagers[match]) {
              logToConsole("Successfully called for the villager named " + match + ".");
              didCommand = true;
              villagers[match] = new Villager(match, "male", undefined);
            } else {
              if(femalevillagers.indexOf(match) != -1 && !villagers[match]) {
                logToConsole("Successfully called for the villager named " + match + ".");
                didCommand = true;
                villagers[match] = new Villager(match, "female", undefined);
              } else {
                logToConsole("That villager is unavailable or you already called for that villager.");
              }
            }
          } else {
            logToConsole("There is insufficient housing for this villager! Build more structures with at least 5 stone and 10 wood first!")
          }
        } else {
          logToConsole("Syntax Error on line " + (line + 1) + ": Should be \"Call for the villager named <name>.\", where <name> is an villager name. There is a list of valid villager names in the documentation.");
        }
      } else {
        if(command.startsWith("Tell")) {
          var matches = command.match(/Tell (\w+) to (.+)\./);
          var villagerName = matches[1];
          var action = matches[2];
          var villager = villagers[villagerName];
          if(villager && villager.cooldown === 0) {
            var matches = action.match(new RegExp(occupationActions[villager.occupation]));
            if(matches) {
              villager.cooldown = 3;
              if(matches.length == 2) {
                villager.ontaskcompletion = new Item(villager.specialItemType, parseInt(matches[1]));
                logToConsole("Successfully told " + villager.name + " to " + action + ". It will be ready in 3 commands.");
                didCommand = true;
              } else {
                didCommand = specialOccupations[villager.occupation](command, matches, villager, line, villagers);
              }
            } else {
              generalActions.forEach(data => {
                var actionRegEx = data[0];
                var successCallback = data[1];
                match = action.match(new RegExp(actionRegEx));
                if(match) {
                  if(successCallback(match, villager, line, villagers)) {
                    didCommand = true;
                  }
                }
              });
            }
          }
        } else {
          if(command.startsWith("Ask")) {
            var option = askCommands.find(option=>command.match(option[0]));
            var matches = command.match(option[0]);
            var result = option[1](matches, line, indentLevel, commands, villagers);
            line = result[0]
            indentLevel = result[1]
            didCommand = result[2]
          } else {
            if(command.startsWith("If") && indentLevel) {
              var indentLevel2 = indentLevel;
              var line2 = line;
              var threwError = false;
              while(line2 < commands.length && indentLevel2 >= indentLevel) {
                line2++;
                var numSpaces = commands[line2].match(/^ */)[0].length;
                if(numSpaces && !commands[line2].substring(numSpaces).startsWith('-+*'.charAt((numSpaces - 1) % 3))) {
                  logToConsole("Indentation Error on line " + (line + 1) + ": Expected '" + '-+*'.charAt((numSpaces - 1) % 3) + "', recieved '" + commands[line2].charAt(numSpaces + 1));
                  threwError = true;
                  break
                }
                indentLevel2 = numSpaces;
              }
              if(line2 < commands.length && !threwError) {
                line = line2 - 1;
              }
            } else {
              if(command.startsWith("Skip")) {
                var matches = command.match(/Skip to (?:step|line) (\d+)\./)
                if(matches) {
                  var lineToJump = parseInt(matches[1]);
                  if(lineToJump < commands.length && lineToJump > 0) {
                    line = lineToJump - 2;
                    didCommand = true;
                  }
                }
              } else {
                if(command.startsWith("Teach")) {
                  var matches = command.match(/Teach (\w+) how to ([a-zA-Z ]+)\./)
                  console.log(matches);
                  if(matches) {
                    var villagerName = matches[1];
                    if(villagers[villagerName] && villagers[villagerName].cooldown == 0) {
                      if(villagers[villagerName].occupation === undefined) {
                        var occupation = Object.keys(occupationTasks).find(x => matches[2].match(occupationTasks[x]))
                        if(occupation) {
                          villagers[villagerName].occupation = occupation;
                          villagers[villagerName].specialItemType = occupations[occupation];
                          logToConsole("Taught " + villagerName + " how to " + matches[2] + ". ")
                        } else {
                          logToConsole("That is not a valid skill! A list of valid skills can be found in the documentation.");
                        }
                      } else {
                        logToConsole("That villager is already skilled in an occupation!");
                      }
                    } else {
                      logToConsole("You have not called for that villager yet or that villager is unavailable.");
                    }
                  }
                }
              }
            }
          }
        }
      }
      if(didCommand) {
        Object.keys(villagers).map(name => {
          if(villagers[name].cooldown > 0) {
            villagers[name].cooldown -= 1;
            if(villagers[name].cooldown == 0) {
              if(villagers[name].occupation != "architect" && villagers[name].occupation != "builder") {
                if(villagers[name].specialItem === null) {
                  villagers[name].specialItem = villagers[name].ontaskcompletion;
                  logToConsole(name + " has finished collecting " + villagers[name].ontaskcompletion.quantity + " " + villagers[name].specialItemType + ". This is all of the " + villagers[name].specialItemType + " " + villagers[name].genderPronoun2 + " has.");
                } else {
                  villagers[name].specialItem.quantity += villagers[name].ontaskcompletion.quantity;
                  logToConsole(name + " has finished collecting " + villagers[name].ontaskcompletion.quantity + " " + villagers[name].specialItemType + ". They now have " + villagers[name].specialItem.quantity + ' ' + villagers[name].specialItemType + ".");
                }
              } else {
                villagers[name].specialItem = villagers[name].ontaskcompletion;
                logToConsole(name + " has finished " + villagers[name].genderPronoun + " task.")
                if(villagers[name].occupation === "builder") {
                  villagers[name].specialItem = null;
                  if(villagers[name].ontaskcompletion) {
                    villagerLimit += villagers[name].ontaskcompletion;
                    logToConsole("The villager limit increased by " + villagers[name].ontaskcompletion);
                  }
                }
              }
              villagers[name].ontaskcompletion = null;
            }
          }
        });
      }
    }
    line++;
  }
  if(infinteLoopProtection <= 0) {
    logToConsole("Execution Error: Program Crashed, execution took too long.");
  }
}