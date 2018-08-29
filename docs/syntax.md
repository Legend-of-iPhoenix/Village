# Syntax Guide
## Indented Blocks
Some commands, like `Ask`, require indented blocks.

Each level of indent adds a space and uses a bullet point.

This code block shows the successive indentation levels. Notice the pattern in the bullet points. (The first line has no indent)
```

 - 
  + 
   * 
    - 
     + 
      * 
```

You are not limited to 6 levels of indentation, the pattern can continue to as high as you need.
## Comments
Comments are lines of code that are not executed. Each comment in village starts with the header "Note: " (case insensitive; "note:", "NOTE:", and even "NoTE:" all work.)

## Villagers
Each villager has a gender, and with it a preferred pronoun. In order to have your villagers do things, you must abide by their preferences.

Male villagers prefer the pronoun "he" and the posessive pronoun "his". Likewise, female villagers prefer "she" and "her".
### Cooldown
After you tell a villager to do a task, they will need time (measured in commands) to do it. You cannot tell the villager to do anything within this "cooldown" period.  
The amount of time varies with the task.

Only commands that do something (not comments, blank lines, or invalid commands) count towards the cooldown.
