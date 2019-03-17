## Tell
These commands perform an action. Tell commands can be "general" (able to be executed by any villager), or "occupation-specific" (only able to be executed by a villager with a specific occupation)

### General
```
Tell <villager> to write the text "<text>" on {his|her} scroll.
Tell <villager> to write {his|her} occupation on {his|her} scroll.
Tell <villager> to post {his|her} scroll on the Community Message Board.
Tell <villager> to write the amount of <itemtype> {he|she} has on {his|her} scroll.
Tell <villager> to {double|triple} {his|her} <itemtype>.
Tell <villager> to give <other villager> {half|a third|all} of {his|her} <itemtype>.
Tell <villager> to clear {his|her} inventory.
Tell <villager> to erase the {first|last} character on {his|her} scroll.
Tell <villager> to clear {his|her} scroll.
Tell <villager> to trade scrolls with <other villager>.
Tell <villager> to write the <nth> letter on {his|her} scroll.
```
**WARNING**: 
Do not compare the inventories of architects, builders, or janitors.
### Occupation-specific
(format: `<occupation name>: <command>`, some occupations may have two or more occupation-specific commands)
```
lumberjack: Tell <villager> to harvest <number> wood.
quarryman:  Tell <villager> to mine <number> stone.
architect:  Tell <villager> to draft a blueprint for a structure requiring {<number>|no} wood and {<number>|no} stone.
architect:  Tell <villager> to draft a blueprint for a railroad to the {north|south|east|west} village.
builder:    Tell <villager> to build a structure using <architect>'s blueprint, <lumberjack>'s wood, and <quarryman>'s stone.
builder:    Tell <villager> to build a railroad using <architect>'s blueprint and <lumberjack>'s wood.
janitor:    Tell <villager> to remove {<number>|all} {scroll|scrolls} from the Community Message Board.
farmer:     Tell <villager> to grow {<number>} wheat.
```
Note:
When the janitor's occupation-specific command is executed, the janitor will throw out his/her current scroll and replace it with the last scroll that they removed. <sup><sub>This allows the Community Message Board to function as a stack. </sup></sub>
## Skip
```
Skip to {line|step} <line>.
```
## Call
```
Call for the villager named <villager name>.
```
### Villager Names
Male villager names: (to-do: add more)
```
Alan
Bertrand
Charles
Dennis
Edsger
George
John
Ken
Linus
```
Female villager names: (to-do: add more)
```
Ada
```
## Teach
```
Teach <villager> how to <skill>.
```
Gives a generic villager an occupation.
### Occupations:
(Format: `<occupation name>: <skill>`)
```
lumberjack: {harvest|gather|collect} wood
quarryman: {mine|quarry} stone
architect: draft blueprints
builder: build structures
janitor: clean the Community Message Board
farmer: {cultivate|grow|harvest|farm} wheat
```
## Ask
Lets you "ask" villagers certain questions and do different actions based on their response.

### Syntax
#### `if...then` case. 
*(Check if condition is true. If it is, execute `<tasks>`, otherwise, skip to the end of the `Ask` block and continue)*
```
Ask <villager> if <question>.
- If {he|she|it} {does|is}:
 + <tasks>
```

#### `if not...then` case. 
*(Check if condition is false. If it is, execute `<tasks>`, otherwise, skip to the end of the `Ask` block and continue)*
```
Ask <villager> if <question>.
- If {he|she|it} {doesn't|isn't}:
 + <tasks>
```

#### `if...then...else` case. 
*(Check if condition is true. If it is, execute `<tasks if true>`, otherwise execute `<tasks if false>`)*
```
Ask <villager> if <question>.
- If {he|she|it} {does|is}:
 + <tasks if true>
- If {he|she|it} {doesn't|isn't}:
 + <tasks if false>
```

Note that with the `if...then...else` case, only one case is executed. The `if` blocks can be placed in any order within an `ask` statement. Nesting of `Ask` statements is allowed, and you can safely `Skip` to outside of the conditional.

The `Ask` block afterwards requires indentation, as described [here](https://github.com/Legend-of-iPhoenix/Village/blob/master/docs/syntax.md).

### Questions
```
{he|she} has {<number>|any} <item>
the text on {his|her} scroll {starts with|ends with|contains} "<text>"
{he|she} has {more|less} <item> than <villager>
{he|she} is {a|an} <occupation>
```

## If
This sub-command of `Ask` defines sections of tasks to be executed if a condition is met or not.

It requires one additional level of indentation.
